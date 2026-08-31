from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import io
import csv
from firebase_admin import firestore

from app.database import get_db
from app.auth import get_current_user, require_shopkeeper
from app.utils import to_object_id, resolve_static_url, get_default_unit
from app.schemas import (
    ShopkeeperApplicationRequest, ApplicationResponse,
    ProductCreateRequest, ProductUpdateRequest, ShopSettingsUpdateRequest,
    OrderStatusUpdateRequest,
)
from app.services.notification_service import notify_order_status, notify_super_admins_new_application

class VerifyPickupCodeRequest(BaseModel):
    pickupCode: str

router = APIRouter(prefix="/shopkeeper", tags=["Shopkeeper"])


# ─── POST /shopkeeper/apply ───────────────────────────────────────────────────

@router.post("/apply", status_code=201)
async def apply_as_shopkeeper(
    body: ShopkeeperApplicationRequest,
    current_user: dict = Depends(get_current_user),
):
    from app.memory_store import add_application
    db = get_db()
    user_id = str(current_user["_id"])

    now = datetime.now(timezone.utc)
    app_id = f"app-{abs(hash(user_id + str(now)))}"

    app_doc = {
        "id": app_id,
        "applicantId": user_id,
        "applicantName": current_user.get("fullName", current_user.get("name", body.ownerName or "Unknown")),
        "applicantEmail": current_user.get("email", body.email.lower()),
        "shopName": body.shopName,
        "category": body.category,
        "address": body.address,
        "city": body.city,
        "pincode": body.pincode,
        "status": "pending",
        "createdAt": now.isoformat(),
        "shopImageUrl": None,
        "businessProofUrl": body.businessProof,
        "userId": user_id,
        "ownerName": body.ownerName or current_user.get("fullName", "Unknown"),
        "phone": body.phone,
        "email": body.email.lower(),
        "description": body.description,
        "rejectionReason": None,
        "submittedAt": now.isoformat(),
        "reviewedAt": None,
        "reviewedBy": None,
    }

    # Save to memory store first
    add_application(app_doc)

    try:
        doc_ref = db.collection("shopkeeper_applications").document()
        app_doc["id"] = doc_ref.id
        app_id = doc_ref.id
        add_application(app_doc)

        doc_ref.set(app_doc)

        try:
            db.collection("users").document(user_id).update({
                "shopkeeperStatus": "pending",
                "isShopkeeper": False,
                "shopkeeperDashboardEnabled": False,
                "activeMode": "customer",
                "updatedAt": now
            })
        except Exception as user_err:
            print(f"[WARN] Failed to update user doc in Firestore: {user_err}")

        try:
            await notify_super_admins_new_application()
        except Exception as notif_err:
            print(f"[WARN] Failed to send notification: {notif_err}")

    except Exception as e:
        print(f"[WARN] Exception during shopkeeper application: {e}")

    return {
        "success": True,
        "message": "Application submitted successfully. You will be notified once reviewed.",
        "applicationId": app_id,
    }


# ─── GET /shopkeeper/status ──────────────────────────────────────────────────

@router.get("/status")
async def get_shopkeeper_status(current_user: dict = Depends(get_current_user)):
    is_approved = (
        current_user.get("isShopkeeper") == True 
        and current_user.get("shopkeeperStatus") == "approved"
        and current_user.get("shopkeeperDashboardEnabled") == True
    )
    return {
        "success": True,
        "is_approved": is_approved,
        "status": current_user.get("shopkeeperStatus", "none")
    }


# ─── GET /shopkeeper/application/status ──────────────────────────────────────

@router.get("/application/status")
async def get_application_status(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    apps_ref = db.collection("shopkeeper_applications").where("userId", "==", user_id).stream()
    apps = list(apps_ref)

    if not apps:
        return {
            "success": True,
            "status": "none",
            "application": None,
        }

    # Sort in memory descending by submittedAt
    def get_submitted_at(doc):
        val = doc.to_dict().get("submittedAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val
    apps.sort(key=get_submitted_at, reverse=True)
    
    application = apps[0].to_dict()

    return {
        "success": True,
        "status": application.get("status", "pending"),
        "rejectionReason": application.get("rejectionReason"),
        "application": {
            "id": apps[0].id,
            "shopName": application.get("shopName", ""),
            "status": application.get("status", "pending"),
            "submittedAt": application.get("submittedAt"),
            "reviewedAt": application.get("reviewedAt"),
            "rejectionReason": application.get("rejectionReason"),
        },
    }


# ─── POST /shopkeeper/enable-dashboard ───────────────────────────────────────

@router.post("/enable-dashboard")
async def enable_dashboard(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    
    # Fetch fresh user data from DB directly to avoid stale token claims
    user_snap = db.collection("users").document(user_id).get()
    if not user_snap.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_doc = user_snap.to_dict()

    print(f"DEBUG [Enable Dashboard API] currentUserId: {user_id}")
    print(f"DEBUG [Enable Dashboard API] current user document: {user_doc}")
    print(f"DEBUG [Enable Dashboard API] isShopkeeper: {user_doc.get('isShopkeeper')}")
    print(f"DEBUG [Enable Dashboard API] shopkeeperStatus: {user_doc.get('shopkeeperStatus')}")

    if not user_doc.get("isShopkeeper", False):
        print("DEBUG [Enable Dashboard API] Blocked: isShopkeeper is not true")
        raise HTTPException(status_code=403, detail="You are not an approved shopkeeper")
    if user_doc.get("shopkeeperStatus") != "approved":
        print(f"DEBUG [Enable Dashboard API] Blocked: shopkeeperStatus is {user_doc.get('shopkeeperStatus')}")
        raise HTTPException(status_code=403, detail="Your shopkeeper application is not approved")
    if user_doc.get("shopkeeperDashboardEnabled", False):
        return {"success": True, "message": "Shopkeeper dashboard already enabled"}

    db.collection("users").document(user_id).update({
        "shopkeeperDashboardEnabled": True,
        "activeMode": "shopkeeper",
        "currentMode": "shopkeeper",
        "role": "shopkeeper",
        "updatedAt": datetime.now(timezone.utc),
    })
    
    print(f"DEBUG [Backend] enable dashboard API: enabled for user {user_id}")

    return {
        "success": True,
        "message": "Shopkeeper dashboard enabled! Welcome to the shopkeeper mode.",
        "currentMode": "shopkeeper",
        "activeMode": "shopkeeper",
    }


# ─── GET /shopkeeper/my-shop ──────────────────────────────────────────────────

@router.get("/my-shop")
async def get_my_shop(current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    user_id = str(current_user["_id"])
    print(f"DEBUG [Backend] currentUser.id: {user_id}")

    shops_ref = db.collection("shops").where("ownerId", "==", user_id).stream()
    shops = list(shops_ref)

    # Return the first active approved shop
    active_shops = [s for s in shops if s.to_dict().get("isActive") and s.to_dict().get("isApproved")]
    shop_snap = active_shops[0] if active_shops else (shops[0] if shops else None)

    shop = shop_snap.to_dict() if shop_snap else {}
    if shop_snap:
        shop["id"] = shop_snap.id
        print(f"DEBUG [Backend] shop document found: {shop}")
    else:
        print(f"DEBUG [Backend] shop document found: None")

    name = shop.get("name") or shop.get("shopName")
    category = shop.get("category")

    # If shop doesn't exist or fields are missing
    if not shop_snap or not name or name == "Shop name not set" or not category or category == "Category not set":
        print("DEBUG [Backend] Shop missing or fields missing. Looking for approved application...")
        
        apps_ref = db.collection("shopkeeper_applications")\
                     .where("applicantId", "==", user_id)\
                     .where("status", "==", "approved").stream()
        apps = list(apps_ref)
        
        if not apps:
            apps_ref = db.collection("shopkeeper_applications")\
                         .where("userId", "==", user_id)\
                         .where("status", "==", "approved").stream()
            apps = list(apps_ref)

        if apps:
            app_doc = apps[0].to_dict()
            print(f"DEBUG [Backend] approved application found: {app_doc}")
            
            updates = {
                "name": app_doc.get("shopName", ""),
                "shopName": app_doc.get("shopName", ""),
                "category": app_doc.get("category", ""),
                "description": app_doc.get("description", ""),
                "address": app_doc.get("address", ""),
                "city": app_doc.get("city", ""),
                "pincode": app_doc.get("pincode", ""),
                "businessPhone": app_doc.get("businessPhone", app_doc.get("phone", "")),
                "businessEmail": app_doc.get("businessEmail", app_doc.get("email", "")),
                "imageUrl": app_doc.get("shopImageUrl", "")
            }
            
            if not shop_snap:
                now = datetime.now(timezone.utc)
                new_shop_ref = db.collection("shops").document()
                updates.update({
                    "id": new_shop_ref.id,
                    "ownerId": user_id,
                    "owner_id": user_id,
                    "applicationId": apps[0].id,
                    "status": "active",
                    "isActive": True,
                    "is_active": True,
                    "isApproved": True,
                    "rating": 0,
                    "ratingCount": 0,
                    "totalOrders": 0,
                    "createdAt": now,
                    "updatedAt": now,
                })
                new_shop_ref.set(updates)
                shop = updates
                print(f"DEBUG [Backend] created missing shop document: {shop}")
                
                # Update user with activeShopId
                db.collection("users").document(user_id).update({
                    "activeShopId": new_shop_ref.id,
                    "shop_id": new_shop_ref.id
                })
            else:
                db.collection("shops").document(shop_snap.id).update(updates)
                shop.update(updates)
                print(f"DEBUG [Backend] repaired shop document: {shop}")
        else:
            print("DEBUG [Backend] No approved application found.")
            if not shop_snap:
                return {"success": True, "shop": None}

    return_fields = {
        "id": shop.get("id"),
        "ownerId": shop.get("ownerId"),
        "name": shop.get("name"),
        "shopName": shop.get("shopName"),
        "category": shop.get("category"),
        "description": shop.get("description"),
        "address": shop.get("address"),
        "city": shop.get("city"),
        "pincode": shop.get("pincode"),
        "businessPhone": shop.get("businessPhone"),
        "businessEmail": shop.get("businessEmail"),
        "imageUrl": resolve_static_url(shop.get("imageUrl")),
        "coverImageUrl": resolve_static_url(shop.get("coverImageUrl")),
        "coverImage": resolve_static_url(shop.get("coverImage")),
        "image": resolve_static_url(shop.get("image")),
        "status": shop.get("status", "active"),
        "isApproved": shop.get("isApproved", True),
        "isActive": shop.get("isActive", True),
        "whatsapp": shop.get("whatsapp"),
        "businessHours": shop.get("businessHours"),
        "rating": shop.get("rating", 0.0),
        "ratingCount": shop.get("ratingCount", 0)
    }

    print(f"DEBUG [Backend] my-shop API response: {return_fields}")
    return {"success": True, "shop": return_fields}

# ─── GET /shopkeeper/dashboard ────────────────────────────────────────────────

@router.get("/dashboard")
async def shopkeeper_dashboard(current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        return {
            "success": True,
            "totalProducts": 0,
            "totalOrders": 0,
            "pendingOrders": 0,
            "completedOrders": 0,
            "revenue": 0
        }
        
    shop_id_str = str(shop_id_str)

    total_products = sum(1 for _ in db.collection("products").where("shopId", "==", shop_id_str).stream())
    orders = list(db.collection("orders").where("shopId", "==", shop_id_str).stream())
    total_orders = len(orders)
    
    pending_orders = sum(
        1 for o in orders 
        if o.to_dict().get("orderStatus") in ["placed", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"]
    )
    completed_orders = sum(
        1 for o in orders 
        if o.to_dict().get("orderStatus") in ["picked_up", "delivered"]
    )

    revenue = sum(
        float(o.to_dict().get("totalAmount", 0.0))
        for o in orders
        if o.to_dict().get("orderStatus") != "cancelled"
    )

    return {
        "success": True,
        "totalProducts": total_products,
        "totalOrders": total_orders,
        "pendingOrders": pending_orders,
        "completedOrders": completed_orders,
        "revenue": round(revenue, 2),
    }


# ─── GET /shopkeeper/orders ───────────────────────────────────────────────────

@router.get("/orders")
async def shopkeeper_orders(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        return {"success": True, "total": 0, "orders": []}

    shop_id_str = str(shop_id_str)

    orders_ref = db.collection("orders").where("shopId", "==", shop_id_str).stream()
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

    customer_ids = list(set([o.to_dict().get("customerId") for o in paginated_orders if o.to_dict().get("customerId")]))
    customers_map = {}
    for c_id in customer_ids:
        c_snap = db.collection("users").document(c_id).get()
        if c_snap.exists:
            customers_map[c_id] = c_snap.to_dict()

    def _fmt(doc_snap):
        o = doc_snap.to_dict()
        cust_id = o.get("customerId")
        cust = customers_map.get(cust_id) if cust_id else None
        cust_phone = cust.get("phone", "") if cust else ""
        cust_name = cust.get("fullName", cust.get("name", "")) if cust else ""
        
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
            "customerName": cust_name or o.get("customerName", "Customer"),
            "customerPhone": cust_phone or o.get("customerPhone", ""),
            "items": formatted_items,
            "totalAmount": o.get("totalAmount", 0),
            "orderType": o.get("orderType", "pickup"),
            "orderStatus": o.get("orderStatus", "placed"),
            "pickupCode": o.get("pickupCode"),
            "pickupTime": o.get("pickupTime"),
            "createdAt": o.get("createdAt"),
        }

    return {"success": True, "total": total, "orders": [_fmt(o) for o in paginated_orders]}


# ─── PUT /shopkeeper/orders/{order_id}/status ─────────────────────────────────

PICKUP_TRANSITIONS = {
    "placed": ["accepted", "cancelled"],
    "accepted": ["preparing", "cancelled"],
    "preparing": ["ready_for_pickup", "cancelled"],
    "ready_for_pickup": [],  # Completed must be done via verify-code endpoint!
}

TERMINAL_STATUSES = {"completed", "cancelled"}


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdateRequest,
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
         raise HTTPException(status_code=403, detail="No shop assigned to you")

    shop_id_str = str(shop_id_str)

    order_ref = db.collection("orders").document(order_id)
    order_snap = order_ref.get()
    if not order_snap.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_snap.to_dict()
    if order["shopId"] != shop_id_str:
        raise HTTPException(status_code=403, detail="Not your order")

    current_status = order.get("orderStatus", "placed")
    new_status = body.status

    if current_status in TERMINAL_STATUSES:
        raise HTTPException(status_code=400, detail="Order is already in a terminal state")

    allowed = PICKUP_TRANSITIONS.get(current_status, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status transition",
        )

    update = {"orderStatus": new_status, "updatedAt": datetime.now(timezone.utc)}
    if new_status == "cancelled":
        update["cancellationReason"] = body.cancellationReason or "Cancelled by Merchant"
        # Restore product stock
        for item in order.get("items", []):
            prod_id = item["productId"]
            prod_ref = db.collection("products").document(prod_id)
            p_snap = prod_ref.get()
            if p_snap.exists:
                p_dict = p_snap.to_dict()
                current_stock = int(p_dict.get("stock", 0) or 0)
                quantity = int(item.get("quantity", 0) or 0)
                new_stock = current_stock + quantity
                upd_fields = {"stock": new_stock}
                if new_stock > 0:
                    upd_fields["isAvailable"] = True
                    upd_fields["is_available"] = True
                prod_ref.update(upd_fields)

    order_ref.update(update)

    # Notify customer
    await notify_order_status(order["customerId"], new_status, order.get("shopName", ""))

    return {
        "success": True,
        "orderId": order_id,
        "orderStatus": new_status,
    }


# ─── POST /shopkeeper/orders/{order_id}/verify-code ───────────────────────────

@router.post("/orders/{order_id}/verify-code")
async def verify_pickup_code(
    order_id: str,
    body: VerifyPickupCodeRequest,
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
         raise HTTPException(status_code=403, detail="No shop assigned to you")

    shop_id_str = str(shop_id_str)

    order_ref = db.collection("orders").document(order_id)
    order_snap = order_ref.get()
    if not order_snap.exists:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = order_snap.to_dict()
    if order["shopId"] != shop_id_str:
        raise HTTPException(status_code=403, detail="Not your order")

    if order.get("orderStatus") != "ready_for_pickup":
        raise HTTPException(status_code=400, detail="Order is not ready for pickup")

    if order.get("pickupCode", "").upper() != body.pickupCode.strip().upper():
        raise HTTPException(status_code=400, detail="Invalid pickup code")

    now = datetime.now(timezone.utc)
    order_ref.update({
        "orderStatus": "completed",
        "paymentStatus": "completed",  # Optionally mark payment as completed (payment handled directly at shop)
        "updatedAt": now
    })

    # Notify customer
    await notify_order_status(order["customerId"], "completed", order.get("shopName", ""))

    return {
        "success": True,
        "message": "Pickup code verified successfully. Order marked as completed.",
        "orderId": order_id,
        "orderStatus": "completed"
    }


# ─── GET /shopkeeper/products ─────────────────────────────────────────────────

@router.get("/products")
async def shopkeeper_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        return {"success": True, "total": 0, "products": []}

    shop_id_str = str(shop_id_str)

    prods_ref = db.collection("products").where("shopId", "==", shop_id_str).stream()
    all_prods = list(prods_ref)

    if category:
        all_prods = [p for p in all_prods if category.lower() in p.to_dict().get("category", "").lower()]
    if search:
        all_prods = [p for p in all_prods if search.lower() in p.to_dict().get("name", "").lower()]

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_prods.sort(key=get_created_at, reverse=True)
    total = len(all_prods)
    paginated = all_prods[skip : skip + limit]

    def _fmt(doc_snap):
        p = doc_snap.to_dict()
        unit_val = p.get("unit") or get_default_unit(p.get("category", ""), p.get("name", ""))
        return {
            "id": doc_snap.id,
            "shopId": str(p.get("shopId", "")),
            "name": p.get("name", ""),
            "description": p.get("description"),
            "category": p.get("category"),
            "price": p.get("price", 0.0),
            "stock": p.get("stock", 0),
            "images": p.get("images", []),
            "isAvailable": p.get("isAvailable", True),
            "unit": unit_val,
            "createdAt": p.get("createdAt"),
        }

    return {"success": True, "total": total, "products": [_fmt(p) for p in paginated]}


# ─── POST /shopkeeper/products ────────────────────────────────────────────────

@router.post("/products", status_code=201)
async def create_product(body: ProductCreateRequest, current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        raise HTTPException(status_code=403, detail="No shop assigned to you")

    shop_id_str = str(shop_id_str)
    now = datetime.now(timezone.utc)

    doc = {
        "shopId": shop_id_str,
        "shop_id": shop_id_str,
        "name": body.name,
        "description": body.description,
        "category": body.category,
        "price": body.price,
        "stock": body.stock,
        "images": body.images or [],
        "isAvailable": body.isAvailable,
        "is_available": body.isAvailable,
        "unit": body.unit or get_default_unit(body.category, body.name),
        "createdAt": now,
        "updatedAt": now,
    }

    _, doc_ref = db.collection("products").add(doc)
    return {"success": True, "productId": doc_ref.id, "message": "Product created"}


# ─── PUT /shopkeeper/products/{product_id} ────────────────────────────────────

@router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    body: ProductUpdateRequest,
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        raise HTTPException(status_code=403, detail="No shop assigned to you")

    shop_id_str = str(shop_id_str)

    prod_ref = db.collection("products").document(product_id)
    product_snap = prod_ref.get()
    if not product_snap.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    product = product_snap.to_dict()
    if product["shopId"] != shop_id_str:
        raise HTTPException(status_code=403, detail="Not your product")

    update_fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Mirror camelCase/snake_case fields
    if "isAvailable" in update_fields:
        update_fields["is_available"] = update_fields["isAvailable"]

    update_fields["updatedAt"] = datetime.now(timezone.utc)
    prod_ref.update(update_fields)

    return {"success": True, "message": "Product updated"}


# ─── DELETE /shopkeeper/products/{product_id} ─────────────────────────────────

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        raise HTTPException(status_code=403, detail="No shop assigned to you")

    shop_id_str = str(shop_id_str)

    prod_ref = db.collection("products").document(product_id)
    product_snap = prod_ref.get()
    if not product_snap.exists:
        raise HTTPException(status_code=404, detail="Product not found")
    product = product_snap.to_dict()
    if product["shopId"] != shop_id_str:
        raise HTTPException(status_code=403, detail="Not your product")

    # Soft delete: mark as unavailable
    prod_ref.update({
        "isAvailable": False,
        "is_available": False,
        "updatedAt": datetime.now(timezone.utc)
    })
    return {"success": True, "message": "Product removed"}


# ─── POST /shopkeeper/products/bulk-import ────────────────────────────────────

@router.post("/products/bulk-import")
async def bulk_import_products(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        raise HTTPException(status_code=403, detail="No shop assigned to you")

    shop_id_str = str(shop_id_str)
    now = datetime.now(timezone.utc)

    content = await file.read()
    rows = []
    try:
        filename = file.filename or ""
        if filename.lower().endswith(".csv"):
            import csv
            text_str = content.decode("utf-8-sig", errors="ignore")
            reader = csv.DictReader(io.StringIO(text_str))
            for r in reader:
                cleaned_row = {str(k).lower().strip(): v for k, v in r.items() if k}
                rows.append(cleaned_row)
        elif filename.lower().endswith((".xlsx", ".xls")):
            import pandas as pd
            df = pd.read_excel(io.BytesIO(content))
            df.columns = df.columns.str.lower().str.strip()
            rows = df.to_dict(orient="records")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV or XLSX.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded file contains no rows.")

    required_cols = {"name", "price"}
    if not required_cols.issubset(set(rows[0].keys())):
        raise HTTPException(status_code=400, detail="File must have at least 'name' and 'price' columns")

    docs = []
    errors = []

    for i, (idx, row) in enumerate(df.iterrows()):
        try:
            unit_val = str(row.get("unit", "")).strip().lower() if "unit" in row else ""
            if not unit_val:
                unit_val = get_default_unit(str(row.get("category", "General")).strip(), str(row["name"]).strip())
            doc = {
                "shopId": shop_id_str,
                "shop_id": shop_id_str,
                "name": str(row["name"]).strip(),
                "description": str(row.get("description", "")).strip() or None,
                "category": str(row.get("category", "General")).strip(),
                "price": float(row["price"] if pd.notna(row.get("price")) else 0.0),
                "stock": int(row.get("stock", 0) if pd.notna(row.get("stock")) else 0),
                "images": [],
                "isAvailable": True,
                "is_available": True,
                "unit": unit_val,
                "createdAt": now,
                "updatedAt": now,
            }
            docs.append(doc)
        except Exception as e:
            errors.append(f"Row {i + 2}: {str(e)}")

    if docs:
        chunk_size = 500
        for i in range(0, len(docs), chunk_size):
            batch = db.batch()
            for doc in docs[i : i + chunk_size]:
                doc_ref = db.collection("products").document()
                batch.set(doc_ref, doc)
            batch.commit()

    return {
        "success": True,
        "imported": len(docs),
        "errors": errors,
        "message": f"Successfully imported {len(docs)} products" + (f" with {len(errors)} errors" if errors else ""),
    }


# ─── POST /shopkeeper/products/bulk ──────────────────────────────────────────

class BulkProductRow(BaseModel):
    name: Optional[str] = None
    productName: Optional[str] = None
    description: Optional[str] = ""
    price: float
    stock: Optional[int] = 0
    threshold: Optional[int] = 5
    category: str
    imageUrl: Optional[str] = ""
    unit: Optional[str] = "pc"

class BulkProductCreateRequest(BaseModel):
    products: List[BulkProductRow]

@router.post("/products/bulk", status_code=201)
async def bulk_add_products(
    body: BulkProductCreateRequest,
    current_user: dict = Depends(require_shopkeeper)
):
    db = get_db()
    
    # 1. Verify current user is approved shopkeeper
    is_approved = current_user.get("shopkeeperStatus") == "approved" or current_user.get("role") == "super_admin"
    if not is_approved:
        raise HTTPException(status_code=403, detail="Shopkeeper is not approved")

    # 2. Get shop by ownerId = currentUser.id
    user_id = str(current_user.get("_id"))
    shops_ref = db.collection("shops").where("ownerId", "==", user_id).stream()
    shops = list(shops_ref)
    if not shops:
        raise HTTPException(status_code=404, detail="No shop found for this shopkeeper")
    
    shop_id_str = shops[0].id
    now = datetime.now(timezone.utc)

    # Pre-fetch existing categories
    all_cats = list(db.collection("categories").stream())
    cat_lower_names = {c.to_dict().get("name", "").strip().lower() for c in all_cats}

    docs = []
    for p in body.products:
        prod_name = p.name or p.productName
        if not prod_name or not prod_name.strip():
            raise HTTPException(status_code=400, detail="Product name is required")
        
        prod_name = prod_name.strip()
        cat_name = p.category.strip()
        if cat_name and cat_name.lower() not in cat_lower_names:
            # Create automatically
            db.collection("categories").add({
                "name": cat_name,
                "icon": "category",
                "description": f"Automatically created category for {cat_name}"
            })
            cat_lower_names.add(cat_name.lower())

        doc = {
            "shopId": shop_id_str,
            "shop_id": shop_id_str,
            "name": prod_name,
            "productName": prod_name,
            "description": p.description or "",
            "price": p.price,
            "stock": p.stock or 0,
            "threshold": p.threshold or 5,
            "low_stock_threshold": p.threshold or 5,
            "category": cat_name,
            "imageUrl": p.imageUrl or "",
            "image": p.imageUrl or "",
            "images": [p.imageUrl] if p.imageUrl else [],
            "isAvailable": True,
            "is_available": True,
            "unit": p.unit or get_default_unit(cat_name, prod_name),
            "createdAt": now,
            "updatedAt": now,
        }
        docs.append(doc)

    if docs:
        chunk_size = 500
        for i in range(0, len(docs), chunk_size):
            batch = db.batch()
            for doc in docs[i : i + chunk_size]:
                doc_ref = db.collection("products").document()
                batch.set(doc_ref, doc)
            batch.commit()

    return {
        "success": True,
        "imported": len(docs),
        "count": len(docs),
        "message": f"Successfully imported {len(docs)} products"
    }


# ─── GET /shopkeeper/reports ──────────────────────────────────────────────────

@router.get("/reports")
async def shopkeeper_reports(current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        return {"success": True, "today": {"total": 0, "count": 0}, "thisWeek": {"total": 0, "count": 0}, "thisMonth": {"total": 0, "count": 0}, "dailyBreakdown": []}

    shop_id_str = str(shop_id_str)
    
    orders_ref = db.collection("orders").where("shopId", "==", shop_id_str).stream()
    all_orders = list(orders_ref)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    def _get_stats(orders_list, start_time):
        total = 0.0
        count = 0
        for doc in orders_list:
            o = doc.to_dict()
            if o.get("orderStatus") == "cancelled":
                continue
            created_at = o.get("createdAt")
            if created_at is None:
                continue
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if created_at >= start_time:
                total += float(o.get("totalAmount", 0.0))
                count += 1
        return {"total": total, "count": count}

    today_data = _get_stats(all_orders, today_start)
    week_data = _get_stats(all_orders, week_start)
    month_data = _get_stats(all_orders, month_start)

    daily_breakdown = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        day_total = 0.0
        day_count = 0
        for doc in all_orders:
            o = doc.to_dict()
            if o.get("orderStatus") == "cancelled":
                continue
            created_at = o.get("createdAt")
            if created_at is None:
                continue
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if day_start <= created_at < day_end:
                day_total += float(o.get("totalAmount", 0.0))
                day_count += 1
                
        daily_breakdown.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "label": day_start.strftime("%a"),
            "revenue": round(day_total, 2),
            "orders": day_count,
        })

    return {
        "success": True,
        "today": {"total": round(today_data["total"], 2), "count": today_data["count"]},
        "thisWeek": {"total": round(week_data["total"], 2), "count": week_data["count"]},
        "thisMonth": {"total": round(month_data["total"], 2), "count": month_data["count"]},
        "dailyBreakdown": daily_breakdown,
    }


# ─── GET /shopkeeper/reports/top-products ─────────────────────────────────────

@router.get("/reports/top-products")
async def get_top_products(current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        return {"success": True, "products": []}
    
    shop_id_str = str(shop_id_str)
    orders_ref = db.collection("orders").where("shopId", "==", shop_id_str).stream()
    
    product_sales = {}
    for doc in orders_ref:
        o = doc.to_dict()
        if o.get("orderStatus") == "cancelled":
            continue
        items = o.get("items", [])
        for item in items:
            p_id = item.get("productId")
            if not p_id:
                continue
            name = item.get("name", "Unknown Product")
            qty = int(item.get("quantity", 0))
            price = float(item.get("price", 0.0))
            
            if p_id not in product_sales:
                product_sales[p_id] = {
                    "id": p_id,
                    "name": name,
                    "category": item.get("category", "General"),
                    "sold": 0,
                    "revenue": 0.0,
                    "icon": "shopping_bag"
                }
            product_sales[p_id]["sold"] += qty
            product_sales[p_id]["revenue"] += qty * price
            
    # Sort by quantity sold descending
    top_products = list(product_sales.values())
    top_products.sort(key=lambda x: x["sold"], reverse=True)
    
    # Format currency/fields
    for p in top_products:
        p["revenue"] = f"₹{round(p['revenue'], 2):.2f}"
        
    return {"success": True, "products": top_products[:5]}


# ─── GET /shopkeeper/invoices ─────────────────────────────────────────────────

@router.get("/invoices")
async def get_invoices(current_user: dict = Depends(require_shopkeeper)):
    return {"success": True, "invoices": []}



# ─── GET /shopkeeper/reviews ──────────────────────────────────────────────────

@router.get("/reviews")
async def shopkeeper_reviews(
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        return {"success": True, "total": 0, "reviews": []}

    shop_id_str = str(shop_id_str)

    reviews_ref = db.collection("reviews").where("shopId", "==", shop_id_str).stream()
    all_reviews = list(reviews_ref)

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_reviews.sort(key=get_created_at, reverse=True)
    total = len(all_reviews)
    paginated = all_reviews[skip : skip + limit]

    def _fmt(doc_snap):
        r = doc_snap.to_dict()
        return {
            "id": doc_snap.id,
            "customerName": r.get("customerName", ""),
            "rating": r.get("rating", 5),
            "comment": r.get("comment"),
            "createdAt": r.get("createdAt"),
        }

    return {"success": True, "total": total, "reviews": [_fmt(r) for r in paginated]}


# ─── GET /shopkeeper/payouts ──────────────────────────────────────────────────

@router.get("/payouts")
async def shopkeeper_payouts(current_user: dict = Depends(require_shopkeeper)):
    return {"success": True, "totalRevenue": 0.0, "totalPaid": 0.0, "pendingPayout": 0.0, "payouts": []}


# ─── GET /shopkeeper/settings ─────────────────────────────────────────────────

@router.get("/settings")
async def get_shop_settings(current_user: dict = Depends(require_shopkeeper)):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
         raise HTTPException(status_code=404, detail="Shop not found")

    shop_id_str = str(shop_id_str)

    shop_snap = db.collection("shops").document(shop_id_str).get()
    if not shop_snap.exists:
        raise HTTPException(status_code=404, detail="Shop not found")
    shop = shop_snap.to_dict()

    return {
        "success": True,
        "settings": {
            "id": shop_snap.id,
            "shopName": shop.get("shopName", ""),
            "category": shop.get("category", ""),
            "address": shop.get("address", ""),
            "phone": shop.get("phone", ""),
            "image": resolve_static_url(shop.get("image")),
            "imageUrl": resolve_static_url(shop.get("imageUrl")),
            "coverImageUrl": resolve_static_url(shop.get("coverImageUrl")),
            "isActive": shop.get("isActive", True),
            "rating": shop.get("rating", 0.0),
        },
    }


# ─── PUT /shopkeeper/settings ─────────────────────────────────────────────────

@router.put("/settings")
async def update_shop_settings(
    body: ShopSettingsUpdateRequest,
    current_user: dict = Depends(require_shopkeeper),
):
    db = get_db()
    shop_id_str = current_user.get("activeShopId") or current_user.get("shop_id")
    if not shop_id_str:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop_id_str = str(shop_id_str)

    shop_ref = db.collection("shops").document(shop_id_str)
    if not shop_ref.get().exists:
        raise HTTPException(status_code=404, detail="Shop not found")

    update_fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updatedAt"] = datetime.now(timezone.utc)
    shop_ref.update(update_fields)

    return {"success": True, "message": "Shop settings updated"}
