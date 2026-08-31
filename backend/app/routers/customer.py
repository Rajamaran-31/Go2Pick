from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone
import secrets
from pydantic import BaseModel, Field
from firebase_admin import firestore
from google.cloud.firestore import transactional

from app.database import get_db
from app.auth import get_current_user
from app.utils import to_object_id, resolve_static_url, get_default_unit
from app.schemas import (
    ShopResponse, ProductResponse, AddToCartRequest,
    CartItemResponse, CreateOrderRequest, ReviewCreateRequest
)
from app.services.notification_service import notify_new_order

router = APIRouter(tags=["Customer"])


class FrontendCartAddRequest(BaseModel):
    productId: Optional[str] = None
    product_id: Optional[str] = None
    quantity: int = Field(1, ge=1)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(1, ge=1)


class FrontendCreateOrderRequest(BaseModel):
    orderType: Optional[str] = None
    order_type: Optional[str] = None
    pickupTime: Optional[str] = None
    pickup_time: Optional[str] = None
    pickup_date: Optional[str] = None
    deliveryAddress: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None


def _shop_response(shop: dict) -> dict:
    logo_val = shop.get("image") or shop.get("imageUrl") or shop.get("shopImageUrl") or shop.get("logo") or shop.get("logoUrl") or ""
    cover_val = shop.get("coverImageUrl") or shop.get("coverImage") or shop.get("banner") or shop.get("bannerImage") or logo_val
    return {
        "id": str(shop.get("_id", shop.get("id", ""))),
        "name": shop.get("name", shop.get("shopName", "")),
        "shopName": shop.get("shopName", shop.get("name", "")),
        "category": shop.get("category", ""),
        "address": shop.get("address", ""),
        "phone": shop.get("phone"),
        "image": resolve_static_url(logo_val),
        "imageUrl": resolve_static_url(logo_val),
        "coverImageUrl": resolve_static_url(cover_val),
        "coverImage": resolve_static_url(cover_val),
        "isActive": shop.get("isActive", shop.get("is_active", True)),
        "is_active": shop.get("is_active", shop.get("isActive", True)),
        "isApproved": shop.get("isApproved", shop.get("is_shop_approved", True)),
        "rating": shop.get("rating", 0.0),
        "ratingCount": shop.get("ratingCount", 0),
        "totalOrders": shop.get("totalOrders", shop.get("total_orders", 0)),
        "closing_time": shop.get("closing_time", "21:00"),
        "description": shop.get("description", ""),
        "createdAt": shop.get("createdAt"),
        "latitude": shop.get("latitude"),
        "longitude": shop.get("longitude"),
    }


def _product_response(product: dict, shop_name: Optional[str] = None) -> dict:
    img_val = product.get("image", product.get("images", [None])[0] if product.get("images") else None)
    imgs_list = product.get("images", [product.get("image")] if product.get("image") else [])
    unit_val = product.get("unit") or get_default_unit(product.get("category", ""), product.get("name", ""))
    
    return {
        "id": str(product.get("_id", product.get("id", ""))),
        "shopId": str(product.get("shopId", product.get("shop_id", ""))),
        "shop_id": str(product.get("shop_id", product.get("shopId", ""))),
        "shopName": shop_name,
        "shop_name": shop_name,
        "name": product.get("name", ""),
        "description": product.get("description"),
        "category": product.get("category"),
        "price": product.get("price", 0.0),
        "stock": product.get("stock", 0),
        "image": resolve_static_url(img_val),
        "images": [resolve_static_url(img) for img in imgs_list if img],
        "isAvailable": product.get("isAvailable", product.get("is_available", True)),
        "is_available": product.get("is_available", product.get("isAvailable", True)),
        "unit": unit_val,
        "createdAt": product.get("createdAt"),
    }


def _get_shop_contact(db, shop_id: str) -> dict:
    """
    Robustly resolve shop contact (phone, email, ownerName) by checking every
    available data source in priority order:
      1. shops.businessPhone / shops.phone
      2. users.phone (owner of the shop via shops.ownerId)
      3. shopkeeper_applications.phone (submitted during registration)
    Returns a dict with: phone, email, shopName, ownerName, shopImageUrl
    """
    contact = {
        "shopId": shop_id,
        "shopName": "",
        "phone": "",
        "email": "",
        "ownerName": "",
        "shopImageUrl": "",
    }

    if not shop_id:
        return contact

    # ── Step 1: Read the shop document ──────────────────────────────────────
    shop_snap = db.collection("shops").document(shop_id).get()
    shop_data = {}
    if shop_snap.exists:
        shop_data = shop_snap.to_dict()
        contact["shopName"] = shop_data.get("name") or shop_data.get("shopName") or ""
        contact["shopImageUrl"] = (
            shop_data.get("imageUrl") or shop_data.get("coverImageUrl") or ""
        )
        # Try all phone fields in the shop doc
        contact["phone"] = (
            shop_data.get("businessPhone")
            or shop_data.get("phone")
            or ""
        )
        contact["email"] = (
            shop_data.get("businessEmail")
            or shop_data.get("email")
            or ""
        )

    # ── Step 2: If still no phone, look up the owner's user document ─────────
    if not contact["phone"]:
        owner_id = shop_data.get("ownerId") or shop_data.get("owner_id")
        if owner_id:
            owner_snap = db.collection("users").document(owner_id).get()
            if owner_snap.exists:
                owner = owner_snap.to_dict()
                contact["phone"] = owner.get("phone") or owner.get("businessPhone") or ""
                contact["email"] = contact["email"] or owner.get("email") or ""
                contact["ownerName"] = (
                    owner.get("fullName") or owner.get("name") or ""
                )

    # ── Step 3: If still no phone, scan shopkeeper_applications ─────────────
    if not contact["phone"]:
        owner_id = shop_data.get("ownerId") or shop_data.get("owner_id")
        queries = []
        if owner_id:
            queries.append(
                db.collection("shopkeeper_applications")
                  .where("applicantId", "==", owner_id)
                  .where("status", "==", "approved")
                  .limit(1)
                  .stream()
            )
            queries.append(
                db.collection("shopkeeper_applications")
                  .where("userId", "==", owner_id)
                  .where("status", "==", "approved")
                  .limit(1)
                  .stream()
            )
        # Also try matching by shopId stored in application
        queries.append(
            db.collection("shopkeeper_applications")
              .where("shopId", "==", shop_id)
              .limit(1)
              .stream()
        )

        for query_stream in queries:
            for doc in query_stream:
                app = doc.to_dict()
                found_phone = (
                    app.get("businessPhone")
                    or app.get("phone")
                    or ""
                )
                if found_phone:
                    contact["phone"] = found_phone
                    contact["email"] = contact["email"] or app.get("businessEmail") or app.get("email") or ""
                    contact["ownerName"] = contact["ownerName"] or app.get("ownerName") or app.get("applicantName") or ""
                    break
            if contact["phone"]:
                break

    return contact


@transactional
def update_stock_and_create_order(transaction, cart_ref, items_to_decrement, order_ref, shop_ref, order_doc):
    # Transactional reads must happen before writes
    # 1. Read shop
    shop_snap = shop_ref.get(transaction=transaction)
    current_total = 0
    if shop_snap.exists:
        current_total = shop_snap.to_dict().get("totalOrders", 0)

    # 2. Read products
    prod_data = []
    for prod_ref, qty in items_to_decrement:
        prod_snap = prod_ref.get(transaction=transaction)
        if not prod_snap.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        p = prod_snap.to_dict()
        if p.get("stock", 0) < qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {p.get('name')}")
        prod_data.append((prod_ref, p.get("stock", 0) - qty))

    # Perform writes
    # 1. Decrement products stock
    for prod_ref, new_stock in prod_data:
        upd = {"stock": new_stock}
        if new_stock <= 0:
            upd["isAvailable"] = False
            upd["is_available"] = False
        transaction.update(prod_ref, upd)

    # 2. Increment shop orders count
    transaction.update(shop_ref, {"totalOrders": current_total + 1, "total_orders": current_total + 1})

    # 3. Save order
    transaction.set(order_ref, order_doc)

    # 4. Clear cart
    transaction.delete(cart_ref)


# ─── GET /shops ───────────────────────────────────────────────────────────────

@router.get("/shops")
async def list_shops(
    search: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
):
    print(f"DEBUG [Customer Shops API] filters applied - search: {search}, category: {category}, city: {city}")
    db = get_db()
    shops_ref = db.collection("shops").stream()
    result = []
    
    for doc in shops_ref:
        s = doc.to_dict()
        
        status = s.get("status", "active")
        is_active = s.get("isActive", s.get("is_active", True))
        is_approved = s.get("isApproved", s.get("is_approved", True))
        
        if status != "active" or is_active == False or is_approved != True:
            continue

        if category and category.lower() not in s.get("category", "").lower():
            continue
        if city and city.lower() not in s.get("city", "").lower():
            continue
        if search:
            search_lower = search.lower()
            if (search_lower not in s.get("name", "").lower() and
                search_lower not in s.get("shopName", "").lower() and
                search_lower not in s.get("category", "").lower()):
                continue

        s["_id"] = doc.id
        result.append(_shop_response(s))

    # Sort by rating descending
    result.sort(key=lambda x: x.get("rating", 0.0), reverse=True)
    paginated = result[skip : skip + limit]
    
    print(f"DEBUG [Customer Shops API] number of shops found: {len(result)}")
    print(f"DEBUG [Customer Shops API] shop ids returned: {[s['id'] for s in paginated]}")
    
    return paginated


# ─── GET /shops/featured ──────────────────────────────────────────────────────

@router.get("/shops/featured")
async def get_featured_shops():
    print("DEBUG [Customer Shops API] Featured shops filters applied - none")
    db = get_db()
    shops_ref = db.collection("shops").stream()
    result = []
    
    for doc in shops_ref:
        s = doc.to_dict()
        status = s.get("status", "active")
        is_active = s.get("isActive", s.get("is_active", True))
        is_approved = s.get("isApproved", s.get("is_approved", True))
        
        if status == "active" and is_active != False and is_approved == True:
            s["_id"] = doc.id
            result.append(_shop_response(s))

    result.sort(key=lambda x: x.get("rating", 0.0), reverse=True)
    top_featured = result[:10]
    
    print(f"DEBUG [Customer Shops API] Featured number of shops found: {len(result)}")
    print(f"DEBUG [Customer Shops API] Featured shop ids returned: {[s['id'] for s in top_featured]}")
    
    return top_featured


# ─── GET /shops/{shop_id} ─────────────────────────────────────────────────────

@router.get("/shops/{shop_id}")
async def get_shop(shop_id: str):
    db = get_db()
    shop_snap = db.collection("shops").document(shop_id).get()
    if not shop_snap.exists:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop = shop_snap.to_dict()
    shop["_id"] = shop_id

    products_ref = db.collection("products").where("shopId", "==", shop_id).stream()
    products = []
    for doc in products_ref:
        p = doc.to_dict()
        is_avail = p.get("isAvailable", p.get("is_available", True))
        if is_avail:
            p["_id"] = doc.id
            products.append(_product_response(p, shop.get("name", shop.get("shopName", ""))))

    return {
        "success": True,
        "shop": _shop_response(shop),
        "products": products,
    }


# ─── GET /shops/{shop_id}/contact ─────────────────────────────────────────────

@router.get("/shops/{shop_id}/contact")
async def get_shop_contact_endpoint(shop_id: str):
    """Public endpoint: returns best-effort contact info for a shop."""
    db = get_db()
    contact = _get_shop_contact(db, shop_id)
    return {"success": True, "contact": contact}


# ─── GET /products ────────────────────────────────────────────────────────────

@router.get("/products")
async def list_products(
    shopId: Optional[str] = None,
    shop_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
):
    db = get_db()
    s_id = shopId or shop_id

    prods_ref = db.collection("products").stream()
    result = []
    shop_ids = set()

    for doc in prods_ref:
        p = doc.to_dict()
        is_avail = p.get("isAvailable", p.get("is_available", True))
        if not is_avail:
            continue

        p_shop_id = p.get("shopId") or p.get("shop_id")
        if s_id and p_shop_id != s_id:
            continue
        if category and category.lower() not in p.get("category", "").lower():
            continue
        if search:
            search_lower = search.lower()
            if (search_lower not in p.get("name", "").lower() and
                search_lower not in p.get("description", "").lower()):
                continue

        p["_id"] = doc.id
        if p_shop_id:
            shop_ids.add(p_shop_id)
        result.append(p)

    # Fetch shop names to inject in product response
    shop_map = {}
    for sh_id in shop_ids:
        sh_snap = db.collection("shops").document(sh_id).get()
        if sh_snap.exists:
            shop_map[sh_id] = sh_snap.to_dict().get("name", sh_snap.to_dict().get("shopName", ""))

    result.sort(key=lambda x: x.get("name", ""))
    paginated = result[skip : skip + limit]

    return [_product_response(p, shop_map.get(p.get("shopId") or p.get("shop_id"), "Unknown")) for p in paginated]


# ─── GET /products/{product_id} ───────────────────────────────────────────────

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    product_snap = db.collection("products").document(product_id).get()
    if not product_snap.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = product_snap.to_dict()
    product["_id"] = product_id

    shop = None
    shop_id_val = product.get("shopId") or product.get("shop_id")
    if shop_id_val:
        sh_snap = db.collection("shops").document(shop_id_val).get()
        if sh_snap.exists:
            shop = sh_snap.to_dict()

    return {"success": True, "product": _product_response(product, shop.get("shopName", "") if shop else None)}


# ─── POST /cart ───────────────────────────────────────────────────────────────

@router.post("/cart")
@router.post("/cart/")
@router.post("/cart/add")
async def add_to_cart(body: FrontendCartAddRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    prod_id = body.productId or body.product_id
    if not prod_id:
        raise HTTPException(status_code=400, detail="productId or product_id is required")

    product_snap = db.collection("products").document(prod_id).get()
    if not product_snap.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    product = product_snap.to_dict()
    product["_id"] = prod_id

    is_avail = product.get("isAvailable", product.get("is_available", True))
    if not is_avail:
        raise HTTPException(status_code=400, detail="Product is not available")
    if product.get("stock", 0) < body.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    shop_id_val = product.get("shopId") or product.get("shop_id")
    if not shop_id_val:
        raise HTTPException(status_code=400, detail="Product does not belong to any shop")

    shop_snap = db.collection("shops").document(shop_id_val).get()
    if not shop_snap.exists:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_snap.to_dict()

    cart_ref = db.collection("carts").document(user_id)
    cart_snap = cart_ref.get()
    existing_cart = cart_snap.to_dict() if cart_snap.exists else None

    if existing_cart and existing_cart.get("shopId") != shop_id_val:
        if len(existing_cart.get("items", [])) > 0:
            raise HTTPException(
                status_code=400,
                detail="You can only order from one shop at a time. Clear your cart first.",
            )
        else:
            # The cart exists but has no items, so we can safely overwrite the shop details.
            existing_cart["shopId"] = shop_id_val
            existing_cart["shopName"] = shop.get("shopName", shop.get("name", ""))

    # Create cart if not exists
    if not existing_cart:
        cart_data = {
            "userId": user_id,
            "shopId": shop_id_val,
            "shopName": shop.get("shopName", shop.get("name", "")),
            "items": [],
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        cart_ref.set(cart_data)
        existing_cart = cart_data

    # Add product
    raw_items = existing_cart.get("items", [])
    items = [item for item in raw_items if isinstance(item, dict)] if isinstance(raw_items, list) else []
    
    found = False
    for item in items:
        if str(item.get("productId")) == prod_id:
            item["quantity"] = item.get("quantity", 0) + body.quantity
            item["subtotal"] = item["quantity"] * item.get("productPrice", 0)
            found = True
            break

    if not found:
        img = product.get("image", product.get("images", [None])[0] if product.get("images") else None)
        unit_val = product.get("unit") or get_default_unit(product.get("category", ""), product.get("name", ""))
        items.append({
            "productId": prod_id,
            "productName": product.get("name", ""),
            "productPrice": product.get("price", 0),
            "productImage": img,
            "productUnit": unit_val,
            "product_unit": unit_val,
            "quantity": body.quantity,
            "subtotal": product.get("price", 0) * body.quantity,
        })

    cart_ref.update({
        "items": items,
        "updatedAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Item added to cart"}


# ─── PUT /cart/{product_id} ───────────────────────────────────────────────────

@router.put("/cart/{product_id}")
async def update_cart_item(
    product_id: str,
    body: UpdateCartItemRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = str(current_user["_id"])

    cart_ref = db.collection("carts").document(user_id)
    cart_snap = cart_ref.get()
    if not cart_snap.exists:
        raise HTTPException(status_code=404, detail="Cart not found")
    cart = cart_snap.to_dict()

    items = cart.get("items", [])
    found = False
    for item in items:
        if str(item["productId"]) == product_id:
            item["quantity"] = body.quantity
            item["subtotal"] = body.quantity * item["productPrice"]
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    cart_ref.update({
        "items": items,
        "updatedAt": datetime.now(timezone.utc)
    })

    return {"success": True, "message": "Cart updated"}


# ─── GET /cart ────────────────────────────────────────────────────────────────

@router.get("/cart")
@router.get("/cart/")
async def get_cart(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    cart_snap = db.collection("carts").document(user_id).get()

    if not cart_snap.exists:
        return {"success": True, "cart": None, "items": [], "total": 0}
    cart = cart_snap.to_dict()

    if not cart.get("items"):
        return {"success": True, "cart": None, "items": [], "total": 0}

    total = sum(item.get("subtotal", 0) for item in cart.get("items", []))
    items = []
    for item in cart.get("items", []):
        unit_val = item.get("productUnit") or item.get("product_unit")
        if not unit_val:
            prod_snap = db.collection("products").document(item.get("productId", "")).get()
            if prod_snap.exists:
                p_data = prod_snap.to_dict()
                unit_val = p_data.get("unit") or get_default_unit(p_data.get("category", ""), p_data.get("name", ""))
            else:
                unit_val = get_default_unit("", item.get("productName", ""))
                
        items.append({
            "id": str(item.get("productId", "")),
            "productId": str(item.get("productId", "")),
            "product_id": str(item.get("productId", "")),
            "productName": item.get("productName", ""),
            "product_name": item.get("productName", ""),
            "productPrice": item.get("productPrice", 0),
            "product_price": item.get("productPrice", 0),
            "productImage": item.get("productImage"),
            "product_image": item.get("productImage"),
            "productUnit": unit_val,
            "product_unit": unit_val,
            "shopId": str(cart.get("shopId", "")),
            "shop_id": str(cart.get("shopId", "")),
            "shopName": cart.get("shopName", ""),
            "shop_name": cart.get("shopName", ""),
            "quantity": item.get("quantity", 1),
            "subtotal": item.get("subtotal", 0),
        })

    return {
        "success": True,
        "shopId": str(cart.get("shopId", "")),
        "shop_id": str(cart.get("shopId", "")),
        "shopName": cart.get("shopName", ""),
        "shop_name": cart.get("shopName", ""),
        "items": items,
        "total": round(total, 2),
    }


# ─── DELETE /cart/item/{product_id} ──────────────────────────────────────────

@router.delete("/cart/item/{product_id}")
@router.delete("/cart/{product_id}")
async def remove_cart_item(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    cart_ref = db.collection("carts").document(user_id)
    cart_snap = cart_ref.get()
    if not cart_snap.exists:
        raise HTTPException(status_code=404, detail="Cart not found")
    cart = cart_snap.to_dict()

    items = [i for i in cart.get("items", []) if str(i["productId"]) != product_id]

    if not items:
        cart_ref.delete()
    else:
        cart_ref.update({
            "items": items,
            "updatedAt": datetime.now(timezone.utc)
        })

    return {"success": True, "message": "Item removed from cart"}


# ─── DELETE /cart ─────────────────────────────────────────────────────────────

@router.delete("/cart")
@router.delete("/cart/clear/all")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    db.collection("carts").document(user_id).delete()
    return {"success": True, "message": "Cart cleared"}


# ─── POST /orders ─────────────────────────────────────────────────────────────

@router.post("/orders", status_code=201)
@router.post("/orders/", status_code=201)
async def create_order(
    body: FrontendCreateOrderRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = str(current_user["_id"])

    cart_ref = db.collection("carts").document(user_id)
    cart_snap = cart_ref.get()
    if not cart_snap.exists:
        raise HTTPException(status_code=400, detail="Your cart is empty")
    cart = cart_snap.to_dict()
    if not cart.get("items"):
        raise HTTPException(status_code=400, detail="Your cart is empty")

    shop_ref = db.collection("shops").document(cart["shopId"])
    shop_snap = shop_ref.get()
    if not shop_snap.exists:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_snap.to_dict()

    is_active_shop = shop.get("isActive", shop.get("is_active", True))
    if not is_active_shop:
        raise HTTPException(status_code=400, detail="This shop is currently not accepting orders")

    order_items = []
    total_amount = 0.0
    items_to_decrement = []

    for item in cart.get("items", []):
        prod_id = item["productId"]
        prod_ref = db.collection("products").document(prod_id)
        prod_snap = prod_ref.get()
        if not prod_snap.exists:
            raise HTTPException(status_code=404, detail=f"Product {item['productName']} not found")
        product = prod_snap.to_dict()
        if product.get("stock", 0) < item["quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item['productName']}",
            )

        items_to_decrement.append((prod_ref, item["quantity"]))
        unit_val = product.get("unit") or get_default_unit(product.get("category", ""), product.get("name", ""))
        order_items.append({
            "productId": prod_id,
            "name": product["name"],
            "price": product["price"],
            "quantity": item["quantity"],
            "image": item.get("productImage"),
            "unit": unit_val,
            "productUnit": unit_val,
            "product_unit": unit_val,
        })
        total_amount += product["price"] * item["quantity"]

    pickup_code = secrets.token_hex(3).upper()
    now = datetime.now(timezone.utc)

    order_type_val = "pickup"
    pickup_time_val = body.pickupTime or body.pickup_time
    if not pickup_time_val and body.pickup_date:
        pickup_time_val = f"{body.pickup_date} {body.pickup_time or ''}".strip()

    order_ref = db.collection("orders").document()
    order_id = order_ref.id

    order_doc = {
        "customerId": user_id,
        "shopId": cart["shopId"],
        "shopName": shop.get("shopName", shop.get("name", "")),
        "customerName": current_user.get("fullName", current_user.get("name", "")),
        "customerPhone": current_user.get("phone", ""),
        "items": order_items,
        "totalAmount": round(total_amount, 2),
        "orderType": "pickup",
        "pickupTime": pickup_time_val,
        "deliveryAddress": None,
        "paymentStatus": "pending",
        "orderStatus": "placed",
        "pickupCode": pickup_code,
        "cancellationReason": None,
        "createdAt": now,
        "updatedAt": now,
    }

    # Execute transactions atomically
    transaction = db.transaction()
    try:
        update_stock_and_create_order(transaction, cart_ref, items_to_decrement, order_ref, shop_ref, order_doc)
    except Exception as tx_err:
        if isinstance(tx_err, HTTPException):
            raise tx_err
        raise HTTPException(status_code=400, detail=f"Order placement failed: {str(tx_err)}")

    # Notify shopkeeper
    owner_id_val = shop.get("ownerId") or shop.get("owner_id")
    if owner_id_val:
        owner_snap = db.collection("users").document(owner_id_val).get()
        if owner_snap.exists:
            await notify_new_order(
                owner_id_val,
                order_id,
                current_user.get("fullName", "Customer"),
            )

    return {
        "success": True,
        "message": "Order placed successfully",
        "orderId": order_id,
        "order_id": order_id,
        "pickupCode": pickup_code,
        "pickup_code": pickup_code,
        "orderCode": pickup_code,
        "order_code": pickup_code,
    }


# ─── GET /orders/my ───────────────────────────────────────────────────────────

@router.get("/orders/my")
async def my_orders(
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = str(current_user["_id"])

    orders_ref = db.collection("orders").where("customerId", "==", user_id).stream()
    all_orders = list(orders_ref)

    if status:
        all_orders = [o for o in all_orders if o.to_dict().get("orderStatus") == status]

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_orders.sort(key=get_created_at, reverse=True)
    total = len(all_orders)
    paginated_orders = all_orders[skip : skip + limit]

    def _fmt(doc_snap):
        o = doc_snap.to_dict()
        
        # Inject default unit if missing for items in order
        formatted_items = []
        for item in o.get("items", []):
            unit_val = item.get("unit") or item.get("productUnit") or item.get("product_unit")
            if not unit_val:
                unit_val = get_default_unit("", item.get("name", item.get("productName", "")))
            formatted_items.append({
                **item,
                "unit": unit_val,
                "productUnit": unit_val,
                "product_unit": unit_val,
            })
            
        return {
            "id": doc_snap.id,
            "shopName": o.get("shopName", o.get("shop_name", "")),
            "shop_name": o.get("shopName", o.get("shop_name", "")),
            "shopId": str(o.get("shopId", o.get("shop_id", ""))),
            "shop_id": str(o.get("shopId", o.get("shop_id", ""))),
            "items": formatted_items,
            "totalAmount": o.get("totalAmount", o.get("total_amount", 0)),
            "total_amount": o.get("totalAmount", o.get("total_amount", 0)),
            "orderType": o.get("orderType", o.get("order_type", "pickup")),
            "order_type": o.get("orderType", o.get("order_type", "pickup")),
            "orderStatus": o.get("orderStatus", o.get("order_status", "placed")),
            "order_status": o.get("orderStatus", o.get("order_status", "placed")),
            "pickupCode": o.get("pickupCode", o.get("pickup_code", "")),
            "pickup_code": o.get("pickupCode", o.get("pickup_code", "")),
            "createdAt": o.get("createdAt"),
            "created_at": o.get("createdAt"),
        }

    return {"success": True, "total": total, "orders": [_fmt(o) for o in paginated_orders]}


# ─── GET /orders/{order_id} ───────────────────────────────────────────────────

@router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    order_snap = db.collection("orders").document(order_id).get()
    if not order_snap.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_snap.to_dict()
    user_id = str(current_user["_id"])

    if order["customerId"] != user_id and current_user.get("role") not in ("shopkeeper", "super_admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    cust_snap = db.collection("users").document(order.get("customerId")).get()
    cust = cust_snap.to_dict() if cust_snap.exists else None
    cust_phone = cust.get("phone", "") if cust else ""
    cust_name = cust.get("fullName", cust.get("name", "")) if cust else ""

    # Resolve shop contact using multi-source fallback helper
    shop_id_val = order.get("shopId", "")
    shop_contact = _get_shop_contact(db, shop_id_val)
    print(f"DEBUG [get_order] resolved shop contact: {shop_contact}")

    # Inject default unit if missing for items in order
    formatted_items = []
    for item in order.get("items", []):
        unit_val = item.get("unit") or item.get("productUnit") or item.get("product_unit")
        if not unit_val:
            unit_val = get_default_unit("", item.get("name", item.get("productName", "")))
        formatted_items.append({
            **item,
            "unit": unit_val,
            "productUnit": unit_val,
            "product_unit": unit_val,
        })
        
    return {
        "success": True,
        "order": {
            "id": order_id,
            "customerId": str(order.get("customerId", "")),
            "shopId": str(order.get("shopId", "")),
            "shopName": shop_contact.get("shopName") or order.get("shopName", ""),
            "businessPhone": shop_contact.get("phone", ""),
            "phone": shop_contact.get("phone", ""),
            "businessEmail": shop_contact.get("email", ""),
            "ownerName": shop_contact.get("ownerName", ""),
            "shopImageUrl": shop_contact.get("shopImageUrl", ""),
            "customerName": cust_name or order.get("customerName", ""),
            "customerPhone": cust_phone or order.get("customerPhone", ""),
            "items": formatted_items,
            "totalAmount": order.get("totalAmount", 0),
            "orderType": order.get("orderType", "pickup"),
            "pickupTime": order.get("pickupTime"),
            "deliveryAddress": order.get("deliveryAddress"),
            "paymentStatus": order.get("paymentStatus", "pending"),
            "orderStatus": order.get("orderStatus", "placed"),
            "pickupCode": order.get("pickupCode"),
            "cancellationReason": order.get("cancellationReason"),
            "createdAt": order.get("createdAt"),
            "updatedAt": order.get("updatedAt"),
        },
    }


# ─── POST /reviews ────────────────────────────────────────────────────────────

@router.post("/reviews", status_code=201)
async def post_review(body: ReviewCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)

    # Check if a review already exists for this shop by this user
    existing_snap = list(db.collection("reviews").where("shopId", "==", body.shopId).where("customerId", "==", user_id).limit(1).stream())

    if existing_snap:
        # Update existing review
        doc_ref = existing_snap[0].reference
        update_data = {
            "rating": body.rating,
            "comment": body.comment,
            "userName": current_user.get("fullName", current_user.get("name", "")),
            "customerName": current_user.get("fullName", current_user.get("name", "")),
            "updatedAt": now
        }
        if body.orderId:
            update_data["orderId"] = body.orderId
        doc_ref.update(update_data)
        review_id = doc_ref.id
        msg = "Review updated successfully"
    else:
        # If orderId is provided, run order validation checks (optional backward compatibility)
        if body.orderId:
            order_snap = db.collection("orders").document(body.orderId).get()
            if not order_snap.exists:
                raise HTTPException(status_code=404, detail="Order not found")
            order = order_snap.to_dict()
            if order["customerId"] != user_id:
                raise HTTPException(status_code=403, detail="Not your order")
            if order["orderStatus"] != "completed":
                raise HTTPException(status_code=400, detail="You can only review completed orders")

        # Create new review
        shop_snap = db.collection("shops").document(body.shopId).get()
        shop = shop_snap.to_dict() if shop_snap.exists else None

        review_doc = {
            "customerId": user_id,
            "userId": user_id,
            "shopId": body.shopId,
            "orderId": body.orderId,
            "customerName": current_user.get("fullName", current_user.get("name", "")),
            "userName": current_user.get("fullName", current_user.get("name", "")),
            "shopName": shop.get("shopName", "") if shop else "",
            "rating": body.rating,
            "comment": body.comment,
            "createdAt": now,
            "updatedAt": now
        }
        _, doc_ref = db.collection("reviews").add(review_doc)
        review_id = doc_ref.id
        msg = "Review submitted successfully"

    # Recalculate average shop rating and ratingCount
    reviews_ref = db.collection("reviews").where("shopId", "==", body.shopId).stream()
    all_reviews = list(reviews_ref)
    rating_val = 0.0
    count_val = len(all_reviews)
    if count_val > 0:
        rating_val = round(sum(float(r.to_dict().get("rating", 0.0)) for r in all_reviews) / count_val, 1)

    db.collection("shops").document(body.shopId).update({
        "rating": rating_val,
        "ratingCount": count_val
    })

    return {"success": True, "message": msg, "reviewId": review_id}


# ─── GET /reviews ─────────────────────────────────────────────────────────────

@router.get("/reviews")
async def get_reviews(shopId: str):
    db = get_db()
    reviews_ref = db.collection("reviews").where("shopId", "==", shopId).stream()
    reviews_list = []
    for doc in reviews_ref:
        r = doc.to_dict()
        reviews_list.append({
            "id": doc.id,
            "customerId": r.get("customerId"),
            "userId": r.get("customerId"),
            "customerName": r.get("customerName") or r.get("userName") or "Anonymous",
            "userName": r.get("userName") or r.get("customerName") or "Anonymous",
            "shopId": r.get("shopId"),
            "orderId": r.get("orderId"),
            "rating": r.get("rating", 0),
            "comment": r.get("comment", ""),
            "createdAt": r.get("createdAt") or r.get("updatedAt"),
        })
    # Sort reviews by createdAt descending
    def get_created_at(x):
        val = x.get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    reviews_list.sort(key=get_created_at, reverse=True)
    return {"success": True, "reviews": reviews_list}


# ─── GET /categories ──────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories():
    db = get_db()
    cats_ref = db.collection("categories").stream()
    categories = []

    for doc in cats_ref:
        cat = doc.to_dict()
        categories.append({
            "id": doc.id,
            "name": cat.get("name", ""),
            "image": cat.get("image", ""),
            "description": cat.get("description", ""),
            "shop_count": cat.get("shop_count", 0),
        })

    categories.sort(key=lambda x: x.get("name", ""))
    return categories


class ToggleFavoriteRequest(BaseModel):
    shopId: str


# ─── POST /favorites/toggle ─────────────────────────────────────────────────

@router.post("/favorites/toggle")
async def toggle_favorite(
    body: ToggleFavoriteRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]
    shop_id = body.shopId

    # Verify that the shop exists
    shop_ref = db.collection("shops").document(shop_id)
    shop_snap = shop_ref.get()
    if not shop_snap.exists:
        raise HTTPException(status_code=404, detail="Shop not found")

    # Check if already favorited
    favs_ref = db.collection("favorites")
    query = favs_ref.where("userId", "==", user_id).where("shopId", "==", shop_id).stream()
    
    existing_fav = None
    for doc in query:
        existing_fav = doc
        break

    if existing_fav:
        # Already favorited, so remove it
        favs_ref.document(existing_fav.id).delete()
        return {"success": True, "message": "Shop removed from favorites", "liked": False}
    else:
        # Not favorited, so add it
        new_fav = {
            "userId": user_id,
            "shopId": shop_id,
            "createdAt": datetime.now(timezone.utc)
        }
        # Add to favorites collection
        favs_ref.add(new_fav)
        return {"success": True, "message": "Shop added to favorites", "liked": True}


# ─── GET /favorites/my ──────────────────────────────────────────────────────

@router.get("/favorites/my")
async def get_my_favorites(
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]

    # Retrieve all favorites for user
    favs_ref = db.collection("favorites").where("userId", "==", user_id).stream()
    
    result = []
    for doc in favs_ref:
        fav_data = doc.to_dict()
        shop_id = fav_data.get("shopId")
        if not shop_id:
            continue
            
        # Fetch shop details
        shop_ref = db.collection("shops").document(shop_id)
        shop_snap = shop_ref.get()
        if shop_snap.exists:
            shop_data = shop_snap.to_dict()
            shop_data["_id"] = shop_snap.id
            shop_response = _shop_response(shop_data)
            result.append({
                "id": doc.id,
                "shopId": shop_id,
                "userId": user_id,
                "shop": shop_response
            })
            
    return result

