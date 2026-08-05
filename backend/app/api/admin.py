from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List

from app.core.database import get_db
from app.core.security import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(require_role(["admin"]))):
    db = get_db()

    total_customers = await db["users"].count_documents({"role": "customer"})
    total_shopkeepers = await db["users"].count_documents({"role": "shopkeeper"})
    total_shops = await db["shops"].count_documents({})
    total_orders = await db["orders"].count_documents({})
    pending_requests = await db["shopkeeper_requests"].count_documents({"status": "pending"})

    # Total revenue
    pipeline = [
        {"$match": {"status": {"$nin": ["cancelled", "rejected"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    rev_result = await db["orders"].aggregate(pipeline).to_list(1)
    total_revenue = rev_result[0]["total"] if rev_result else 0

    # Recent orders
    recent_orders = await db["orders"].find().sort("created_at", -1).limit(10).to_list(10)
    recent = []
    for o in recent_orders:
        recent.append({
            "id": str(o["_id"]),
            "customer_name": o.get("customer_name", ""),
            "shop_name": o.get("shop_name", ""),
            "total": o["total"],
            "status": o["status"],
            "created_at": o["created_at"].isoformat() if o.get("created_at") else "",
        })

    return {
        "total_customers": total_customers,
        "total_shopkeepers": total_shopkeepers,
        "total_shops": total_shops,
        "total_orders": total_orders,
        "pending_requests": pending_requests,
        "total_revenue": round(total_revenue, 2),
        "recent_orders": recent,
    }


@router.get("/users")
async def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    users = await db["users"].find(query, {"password": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db["users"].count_documents(query)

    result = []
    for u in users:
        order_count = await db["orders"].count_documents({"user_id": u["_id"]})
        result.append({
            "id": str(u["_id"]),
            "name": u["name"],
            "email": u["email"],
            "phone": u.get("phone", ""),
            "role": u.get("role", "customer"),
            "is_blocked": u.get("is_blocked", False),
            "order_count": order_count,
            "created_at": u["created_at"].isoformat() if u.get("created_at") else "",
        })

    return {"users": result, "total": total}


@router.put("/users/{user_id}/block")
async def toggle_block_user(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    user = await db["users"].find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot block admin users")

    new_status = not user.get("is_blocked", False)
    await db["users"].update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {"is_blocked": new_status}},
    )

    return {"message": f"User {'blocked' if new_status else 'unblocked'} successfully", "is_blocked": new_status}


@router.get("/shopkeeper-requests")
async def list_shopkeeper_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    query = {}
    if status_filter:
        query["status"] = status_filter

    requests = await db["shopkeeper_requests"].find(query).sort("created_at", -1).to_list(100)
    result = []
    for r in requests:
        user = await db["users"].find_one({"_id": r["user_id"]}, {"password": 0})
        result.append({
            "id": str(r["_id"]),
            "user_id": str(r["user_id"]),
            "user_name": user["name"] if user else "Unknown",
            "user_email": user["email"] if user else "",
            "owner_name": r.get("owner_name", "Unknown"),
            "shop_name": r.get("shop_name", "Unknown Shop"),
            "category": r.get("category", "Uncategorized"),
            "phone": r.get("phone", "N/A"),
            "email": r.get("email", "N/A"),
            "address": r.get("address", "N/A"),
            "shop_image": r.get("shop_image"),
            "business_proof": r.get("business_proof"),
            "description": r.get("description"),
            "opening_time": r.get("opening_time"),
            "closing_time": r.get("closing_time"),
            "status": r.get("status", "pending"),
            "admin_notes": r.get("admin_notes"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else "",
        })
    return result


@router.put("/shopkeeper-requests/{request_id}/approve")
async def approve_request(
    request_id: str,
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    request = await db["shopkeeper_requests"].find_one({"_id": to_object_id(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    # Create the shop
    shop_doc = {
        "owner_id": request["user_id"],
        "name": request.get("shop_name", "Unknown Shop"),
        "category": request.get("category", "Uncategorized"),
        "address": request.get("address", "N/A"),
        "image": request.get("shop_image"),
        "description": request.get("description"),
        "opening_time": request.get("opening_time", "09:00"),
        "closing_time": request.get("closing_time", "21:00"),
        "phone": request.get("phone", "N/A"),
        "email": request.get("email", "N/A"),
        "is_active": True,
        "rating": 4.0,
        "total_orders": 0,
        "created_at": datetime.now(timezone.utc),
    }
    shop_result = await db["shops"].insert_one(shop_doc)

    # Update user role
    await db["users"].update_one(
        {"_id": request["user_id"]},
        {"$set": {
            "role": "shopkeeper",
            "is_shopkeeper_approved": True,
            "is_shop_approved": True,
            "shop_id": shop_result.inserted_id,
        }},
    )

    # Update request
    await db["shopkeeper_requests"].update_one(
        {"_id": to_object_id(request_id)},
        {"$set": {"status": "approved"}},
    )
    
    # Create notification
    notification_doc = {
        "user_id": request["user_id"],
        "type": "shop_approved",
        "title": "Your Shop Has Been Approved! 🎉",
        "message": "Congratulations! Your shop registration has been approved by the admin. Click Get Access to start selling.",
        "is_read": False,
        "show_get_access_button": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db["notifications"].insert_one(notification_doc)

    # Create audit log
    await db["audit_logs"].insert_one({
        "admin_id": to_object_id(current_user["_id"]),
        "admin_name": current_user["name"],
        "action": "SHOP_APPROVED",
        "target_type": "shop",
        "target_id": shop_result.inserted_id,
        "details": request["shop_name"],
        "created_at": datetime.now(timezone.utc)
    })

    return {"message": "Shopkeeper request approved. Shop created successfully."}


@router.put("/shopkeeper-requests/{request_id}/reject")
async def reject_request(
    request_id: str,
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    request = await db["shopkeeper_requests"].find_one({"_id": to_object_id(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    await db["shopkeeper_requests"].update_one(
        {"_id": to_object_id(request_id)},
        {"$set": {"status": "rejected"}},
    )

    return {"message": "Shopkeeper request rejected"}


@router.get("/shops")
async def list_all_shops(
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    shops = await db["shops"].find().sort("created_at", -1).to_list(200)
    result = []
    for s in shops:
        owner = await db["users"].find_one({"_id": s["owner_id"]}, {"password": 0})
        result.append({
            "id": str(s["_id"]),
            "name": s["name"],
            "owner_name": owner["name"] if owner else "Unknown",
            "category": s.get("category", ""),
            "address": s.get("address", ""),
            "image": s.get("image"),
            "rating": s.get("rating", 0),
            "total_orders": s.get("total_orders", 0),
            "is_active": s.get("is_active", True),
            "created_at": s["created_at"].isoformat() if s.get("created_at") else "",
        })
    return result


@router.put("/shops/{shop_id}/toggle")
async def toggle_shop(
    shop_id: str,
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    shop = await db["shops"].find_one({"_id": to_object_id(shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    new_status = not shop.get("is_active", True)
    await db["shops"].update_one(
        {"_id": to_object_id(shop_id)},
        {"$set": {"is_active": new_status}},
    )
    return {"message": f"Shop {'activated' if new_status else 'deactivated'}", "is_active": new_status}


@router.get("/orders")
async def list_all_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_role(["admin"])),
):
    db = get_db()
    query = {}
    if status_filter:
        query["status"] = status_filter
    if search:
        query["$or"] = [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"shop_name": {"$regex": search, "$options": "i"}},
        ]

    orders = await db["orders"].find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db["orders"].count_documents(query)

    result = []
    for o in orders:
        result.append({
            "id": str(o["_id"]),
            "customer_name": o.get("customer_name", ""),
            "customer_phone": o.get("customer_phone", ""),
            "shop_name": o.get("shop_name", ""),
            "items_count": len(o.get("items", [])),
            "total": o["total"],
            "status": o["status"],
            "pickup_date": o.get("pickup_date", ""),
            "pickup_time": o.get("pickup_time", ""),
            "created_at": o["created_at"].isoformat() if o.get("created_at") else "",
        })

    return {"orders": result, "total": total}


@router.get("/reviews")
async def admin_get_reviews(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    current_user: dict = Depends(require_role(["admin"]))
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    reviews = await db["reviews"].find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for r in reviews:
        result.append({
            "id": str(r["_id"]),
            "user_id": str(r["user_id"]),
            "shop_id": str(r["shop_id"]),
            "customer_name": r.get("customer_name", ""),
            "shop_name": r.get("shop_name", ""),
            "rating": r.get("rating", 0),
            "review_text": r.get("review_text", ""),
            "status": r.get("status", "approved"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else ""
        })
    return {"reviews": result}

@router.put("/reviews/{review_id}/status")
async def admin_update_review_status(
    review_id: str,
    status_data: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    from app.utils.object_id import to_object_id
    db = get_db()
    
    new_status = status_data.get("status", "approved")
    await db["reviews"].update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {"status": new_status}}
    )
    
    await db["audit_logs"].insert_one({
        "admin_id": to_object_id(current_user["_id"]),
        "admin_name": current_user["name"],
        "action": f"REVIEW_STATUS_UPDATE_{new_status.upper()}",
        "target_type": "review",
        "target_id": to_object_id(review_id),
        "details": f"Updated review {review_id} to {new_status}",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Status updated successfully"}


@router.get("/tickets")
async def admin_get_tickets(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    current_user: dict = Depends(require_role(["admin"]))
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    tickets = await db["support_tickets"].find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for t in tickets:
        result.append({
            "id": str(t["_id"]),
            "ticket_number": t.get("ticket_number", ""),
            "user_id": str(t["user_id"]),
            "user_name": t.get("user_name", ""),
            "category": t.get("category", ""),
            "subject": t.get("subject", ""),
            "message": t.get("message", ""),
            "status": t.get("status", "open"),
            "priority": t.get("priority", "low"),
            "created_at": t["created_at"].isoformat() if t.get("created_at") else ""
        })
    return {"tickets": result}

@router.put("/tickets/{ticket_id}/status")
async def admin_update_ticket_status(
    ticket_id: str,
    status_data: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    from app.utils.object_id import to_object_id
    db = get_db()
    
    new_status = status_data.get("status", "open")
    await db["support_tickets"].update_one(
        {"_id": to_object_id(ticket_id)},
        {"$set": {"status": new_status}}
    )
    return {"message": "Ticket status updated"}


@router.get("/merchant-logs")
async def admin_get_merchant_logs(
    limit: int = Query(default=50, le=100),
    current_user: dict = Depends(require_role(["admin"]))
):
    db = get_db()
    logs = await db["merchant_logs"].find().sort("created_at", -1).limit(limit).to_list(limit)
    result = []
    for l in logs:
        result.append({
            "id": str(l["_id"]),
            "merchant_id": str(l["merchant_id"]),
            "merchant_name": l.get("merchant_name", ""),
            "shop_name": l.get("shop_name", ""),
            "event_type": l.get("event_type", ""),
            "description": l.get("description", ""),
            "status": l.get("status", ""),
            "created_at": l["created_at"].isoformat() if l.get("created_at") else ""
        })
    return {"logs": result}


@router.get("/audit-logs")
async def admin_get_audit_logs(
    limit: int = Query(default=50, le=100),
    current_user: dict = Depends(require_role(["admin"]))
):
    db = get_db()
    logs = await db["audit_logs"].find().sort("created_at", -1).limit(limit).to_list(limit)
    result = []
    for l in logs:
        result.append({
            "id": str(l["_id"]),
            "admin_id": str(l["admin_id"]),
            "admin_name": l.get("admin_name", ""),
            "action": l.get("action", ""),
            "target_type": l.get("target_type", ""),
            "target_id": str(l.get("target_id", "")),
            "details": l.get("details", ""),
            "created_at": l["created_at"].isoformat() if l.get("created_at") else ""
        })
    return {"logs": result}


@router.get("/settings")
async def admin_get_settings(
    current_user: dict = Depends(require_role(["admin"]))
):
    db = get_db()
    settings = await db["platform_settings"].find_one()
    if not settings:
        return {
            "commission_percentage": 12.5,
            "flat_processing_fee": 0.50,
            "merchant_payout_delay": "T+2"
        }
    settings["id"] = str(settings["_id"])
    del settings["_id"]
    return settings

@router.put("/settings")
async def admin_update_settings(
    settings_data: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    from app.utils.object_id import to_object_id
    db = get_db()
    settings_data["updated_at"] = datetime.now(timezone.utc)
    settings_data["updated_by"] = to_object_id(current_user["_id"])
    
    await db["platform_settings"].update_one(
        {},
        {"$set": settings_data},
        upsert=True
    )
    
    await db["audit_logs"].insert_one({
        "admin_id": to_object_id(current_user["_id"]),
        "admin_name": current_user["name"],
        "action": "SETTINGS_UPDATED",
        "target_type": "settings",
        "target_id": None,
        "details": "Platform settings updated",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Settings updated"}

@router.get("/roles/{user_id}")
async def admin_get_role(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    from app.utils.object_id import to_object_id
    db = get_db()
    user = await db["users"].find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(404, "User not found")
    
    return {
        "user_id": str(user["_id"]),
        "name": user.get("name", ""),
        "role": user.get("role", "customer"),
        "permissions": user.get("permissions", {})
    }

@router.put("/roles/{user_id}")
async def admin_update_role(
    user_id: str,
    role_data: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    from app.utils.object_id import to_object_id
    db = get_db()
    
    await db["users"].update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {
            "role": role_data.get("role", "customer"),
            "permissions": role_data.get("permissions", {})
        }}
    )
    return {"message": "Role updated"}
