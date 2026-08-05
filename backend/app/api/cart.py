from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.cart import CartItemCreate, CartItemUpdate, CartItemResponse

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def cart_item_to_response(item: dict) -> CartItemResponse:
    return CartItemResponse(
        id=str(item["_id"]),
        user_id=str(item["user_id"]),
        product_id=str(item["product_id"]),
        shop_id=str(item["shop_id"]),
        product_name=item["product_name"],
        product_image=item.get("product_image"),
        product_price=item["product_price"],
        shop_name=item["shop_name"],
        quantity=item["quantity"],
        subtotal=item["product_price"] * item["quantity"],
    )


@router.get("/", response_model=List[CartItemResponse])
async def get_cart(current_user: dict = Depends(get_current_user)):
    db = get_db()
    items = await db["cart_items"].find(
        {"user_id": to_object_id(current_user["_id"])}
    ).to_list(100)
    return [cart_item_to_response(item) for item in items]


@router.post("/", response_model=CartItemResponse, status_code=201)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    product = await db["products"].find_one({"_id": to_object_id(item_data.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.get("is_available", True):
        raise HTTPException(status_code=400, detail="Product is not available")
    if product.get("stock", 0) < item_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    shop = await db["shops"].find_one({"_id": product["shop_id"]})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    # Check if user already has items from a different shop
    existing_cart = await db["cart_items"].find_one({"user_id": to_object_id(current_user["_id"])})
    if existing_cart and str(existing_cart["shop_id"]) != str(product["shop_id"]):
        raise HTTPException(
            status_code=400,
            detail="You can only order from one shop at a time. Please clear your cart first.",
        )

    # Check if product already in cart
    existing_item = await db["cart_items"].find_one({
        "user_id": to_object_id(current_user["_id"]),
        "product_id": to_object_id(item_data.product_id),
    })

    if existing_item:
        new_qty = existing_item["quantity"] + item_data.quantity
        await db["cart_items"].update_one(
            {"_id": existing_item["_id"]},
            {"$set": {"quantity": new_qty}},
        )
        existing_item["quantity"] = new_qty
        return cart_item_to_response(existing_item)

    cart_doc = {
        "user_id": to_object_id(current_user["_id"]),
        "product_id": to_object_id(item_data.product_id),
        "shop_id": product["shop_id"],
        "product_name": product["name"],
        "product_image": product.get("image"),
        "product_price": product["price"],
        "shop_name": shop["name"],
        "quantity": item_data.quantity,
    }

    result = await db["cart_items"].insert_one(cart_doc)
    cart_doc["_id"] = result.inserted_id
    return cart_item_to_response(cart_doc)


@router.put("/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: str,
    update_data: CartItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    item = await db["cart_items"].find_one({
        "_id": to_object_id(item_id),
        "user_id": to_object_id(current_user["_id"]),
    })
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    await db["cart_items"].update_one(
        {"_id": to_object_id(item_id)},
        {"$set": {"quantity": update_data.quantity}},
    )
    item["quantity"] = update_data.quantity
    return cart_item_to_response(item)


@router.delete("/{item_id}")
async def remove_cart_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    result = await db["cart_items"].delete_one({
        "_id": to_object_id(item_id),
        "user_id": to_object_id(current_user["_id"]),
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}


@router.delete("/clear/all")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db["cart_items"].delete_many({"user_id": to_object_id(current_user["_id"])})
    return {"message": "Cart cleared"}
