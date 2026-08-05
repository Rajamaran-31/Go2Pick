from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List, Any

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.order import OrderCreate, OrderStatusUpdate, OrderResponse, OrderItem

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def order_to_response(order: dict) -> OrderResponse:
    items = [OrderItem(**item) for item in order.get("items", [])]
    return OrderResponse(
        id=str(order["_id"]),
        user_id=str(order["user_id"]),
        shop_id=str(order["shop_id"]),
        shop_name=order.get("shop_name", ""),
        items=items,
        total=order["total"],
        status=order["status"],
        pickup_date=order["pickup_date"],
        pickup_time=order["pickup_time"],
        customer_name=order.get("customer_name", ""),
        customer_phone=order.get("customer_phone", ""),
        notes=order.get("notes"),
        created_at=order.get("created_at", datetime.now(timezone.utc)),
        updated_at=order.get("updated_at"),
    )


@router.post("/", response_model=OrderResponse, status_code=201)
async def place_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = to_object_id(current_user["_id"])

    print(f"--- Checkout Validation ---")
    print(f"Received shopId: {order_data.shopId}")
    
    # Get cart items from DB
    db_cart_items = await db["cart_items"].find({"user_id": user_id}).to_list(100)
    print(f"DB Cart items count: {len(db_cart_items)}")
    
    # If DB cart is empty but payload has items, use payload items
    cart_items = db_cart_items
    if not cart_items and order_data.items:
        print("DB cart empty, using payload items")
        cart_items = [
            {
                "product_id": item.product_id,
                "product_name": item.name,
                "product_price": item.price,
                "quantity": item.quantity,
                "product_image": item.image,
                "shop_id": order_data.shopId
            } for item in order_data.items
        ]
        
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    product_shop_ids = [str(item.get("shop_id")) for item in cart_items]
    print(f"Product shopIds in cart: {product_shop_ids}")

    # Determine shop_id
    shop_id_str = order_data.shopId
    if not shop_id_str and cart_items:
        shop_id_str = str(cart_items[0].get("shop_id"))
        
    if not shop_id_str or shop_id_str == "None":
        raise HTTPException(
            status_code=400, 
            detail="Invalid cart. Please clear cart and add products again."
        )

    try:
        shop_id = to_object_id(shop_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid shop ID format")

    print(f"Checking shop collection for ID: {shop_id}")
    shop = await db["shops"].find_one({"_id": shop_id})
    if not shop:
        print("Shop not found in DB!")
        raise HTTPException(status_code=404, detail="Shop not found")

    order_items = []
    total = 0.0
    for item in cart_items:
        subtotal = item["product_price"] * item["quantity"]
        total += subtotal
        order_items.append({
            "product_id": str(item["product_id"]),
            "name": item["product_name"],
            "price": item["product_price"],
            "quantity": item["quantity"],
            "image": item.get("product_image"),
        })

        # Reduce stock
        try:
            prod_obj_id = to_object_id(item["product_id"])
            await db["products"].update_one(
                {"_id": prod_obj_id},
                {"$inc": {"stock": -item["quantity"]}},
            )
        except Exception:
            pass

    order_doc = {
        "user_id": user_id,
        "shop_id": shop_id,
        "shop_name": shop["name"],
        "items": order_items,
        "total": round(total, 2),
        "status": "pending",
        "pickup_date": order_data.pickup_date,
        "pickup_time": order_data.pickup_time,
        "customer_name": current_user["name"],
        "customer_phone": current_user.get("phone", ""),
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db["orders"].insert_one(order_doc)
    order_doc["_id"] = result.inserted_id

    # Update shop order count
    await db["shops"].update_one({"_id": shop_id}, {"$inc": {"total_orders": 1}})

    # Clear cart
    await db["cart_items"].delete_many({"user_id": user_id})

    return order_to_response(order_doc)


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    query: dict[str, Any] = {}
    if current_user["role"] == "shopkeeper" and current_user.get("shop_id"):
        query["shop_id"] = to_object_id(current_user["shop_id"])
    else:
        query["user_id"] = to_object_id(current_user["_id"])

    if status_filter:
        query["status"] = status_filter

    orders = await db["orders"].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [order_to_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        order = await db["orders"].find_one({"_id": to_object_id(order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify access
    user_id = to_object_id(current_user["_id"])
    if order["user_id"] != user_id:
        if current_user["role"] == "shopkeeper" and current_user.get("shop_id"):
            if order["shop_id"] != to_object_id(current_user["shop_id"]):
                raise HTTPException(status_code=403, detail="Access denied")
        elif current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

    return order_to_response(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_data: OrderStatusUpdate,
    current_user: dict = Depends(require_role(["shopkeeper", "admin"])),
):
    db = get_db()
    order = await db["orders"].find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user["role"] == "shopkeeper":
        if not current_user.get("shop_id") or order["shop_id"] != to_object_id(current_user["shop_id"]):
            raise HTTPException(status_code=403, detail="Not your order")

    # Validate status transition
    valid_transitions = {
        "pending": ["accepted", "rejected"],
        "accepted": ["preparing"],
        "preparing": ["ready"],
        "ready": ["completed"],
    }
    current_status = order["status"]
    if status_data.status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from '{current_status}' to '{status_data.status}'",
        )

    # If rejected, restore stock
    if status_data.status == "rejected":
        for item in order.get("items", []):
            await db["products"].update_one(
                {"_id": to_object_id(item["product_id"])},
                {"$inc": {"stock": item["quantity"]}},
            )

    await db["orders"].update_one(
        {"_id": to_object_id(order_id)},
        {"$set": {"status": status_data.status, "updated_at": datetime.now(timezone.utc)}},
    )

    updated = await db["orders"].find_one({"_id": to_object_id(order_id)})
    return order_to_response(updated)


@router.put("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    order = await db["orders"].find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["user_id"] != to_object_id(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your order")

    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")

    # Restore stock
    for item in order.get("items", []):
        await db["products"].update_one(
            {"_id": to_object_id(item["product_id"])},
            {"$inc": {"stock": item["quantity"]}},
        )

    await db["orders"].update_one(
        {"_id": to_object_id(order_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}},
    )

    updated = await db["orders"].find_one({"_id": to_object_id(order_id)})
    return order_to_response(updated)
