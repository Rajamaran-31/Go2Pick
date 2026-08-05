from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.shopkeeper_request import ShopkeeperRequestCreate, ShopkeeperRequestResponse

router = APIRouter(prefix="/api/shopkeeper", tags=["Shopkeeper"])


def request_to_response(req: dict) -> ShopkeeperRequestResponse:
    return ShopkeeperRequestResponse(
        id=str(req["_id"]),
        user_id=str(req["user_id"]),
        owner_name=req["owner_name"],
        shop_name=req["shop_name"],
        category=req["category"],
        phone=req["phone"],
        email=req["email"],
        address=req["address"],
        shop_image=req.get("shop_image"),
        business_proof=req.get("business_proof"),
        description=req.get("description"),
        opening_time=req.get("opening_time", "09:00"),
        closing_time=req.get("closing_time", "21:00"),
        status=req.get("status", "pending"),
        admin_notes=req.get("admin_notes"),
        created_at=req.get("created_at", datetime.now(timezone.utc)),
    )


@router.post("/request", response_model=ShopkeeperRequestResponse, status_code=201)
async def submit_request(
    request_data: ShopkeeperRequestCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    # Check if already has a pending request
    existing = await db["shopkeeper_requests"].find_one({
        "user_id": to_object_id(current_user["_id"]),
        "status": "pending",
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request")

    # Check if already a shopkeeper
    if current_user.get("role") == "shopkeeper":
        raise HTTPException(status_code=400, detail="You are already a shopkeeper")

    req_doc = {
        "user_id": to_object_id(current_user["_id"]),
        "owner_name": request_data.owner_name,
        "shop_name": request_data.shop_name,
        "category": request_data.category,
        "phone": request_data.phone,
        "email": request_data.email,
        "address": request_data.address,
        "shop_image": request_data.shop_image,
        "business_proof": request_data.business_proof,
        "description": request_data.description,
        "opening_time": request_data.opening_time,
        "closing_time": request_data.closing_time,
        "status": "pending",
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db["shopkeeper_requests"].insert_one(req_doc)
    req_doc["_id"] = result.inserted_id
    return request_to_response(req_doc)


@router.get("/request/status", response_model=ShopkeeperRequestResponse)
async def get_request_status(current_user: dict = Depends(get_current_user)):
    db = get_db()
    request = await db["shopkeeper_requests"].find_one(
        {"user_id": to_object_id(current_user["_id"])},
        sort=[("created_at", -1)],
    )
    if not request:
        raise HTTPException(status_code=404, detail="No shopkeeper request found")
    return request_to_response(request)


@router.get("/status")
async def get_shopkeeper_status(current_user: dict = Depends(get_current_user)):
    db = get_db()
    request = await db["shopkeeper_requests"].find_one(
        {"user_id": to_object_id(str(current_user["_id"]))},
        sort=[("created_at", -1)],
    )
    if not request:
        return {"is_approved": False, "status": "none"}
    
    status = request.get("status", "pending")
    return {
        "is_approved": status.lower() == "approved",
        "status": status
    }



@router.get("/dashboard")
async def shopkeeper_dashboard(
    current_user: dict = Depends(require_role(["shopkeeper"])),
):
    db = get_db()
    shop_id = to_object_id(current_user["shop_id"])

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_products = await db["products"].count_documents({"shop_id": shop_id})
    today_orders = await db["orders"].count_documents({
        "shop_id": shop_id,
        "created_at": {"$gte": today_start},
    })
    pending_orders = await db["orders"].count_documents({
        "shop_id": shop_id,
        "status": {"$in": ["pending", "accepted", "preparing"]},
    })
    total_orders = await db["orders"].count_documents({"shop_id": shop_id})

    # Calculate today's revenue
    pipeline = [
        {"$match": {"shop_id": shop_id, "created_at": {"$gte": today_start}, "status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    revenue_result = await db["orders"].aggregate(pipeline).to_list(1)
    today_revenue = revenue_result[0]["total"] if revenue_result else 0

    # Total revenue
    pipeline_total = [
        {"$match": {"shop_id": shop_id, "status": {"$nin": ["cancelled", "rejected"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}},
    ]
    total_revenue_result = await db["orders"].aggregate(pipeline_total).to_list(1)
    total_revenue = total_revenue_result[0]["total"] if total_revenue_result else 0

    # Recent orders
    recent_orders = await db["orders"].find(
        {"shop_id": shop_id}
    ).sort("created_at", -1).limit(5).to_list(5)

    recent = []
    for o in recent_orders:
        recent.append({
            "id": str(o["_id"]),
            "customer_name": o.get("customer_name", ""),
            "total": o["total"],
            "status": o["status"],
            "items_count": len(o.get("items", [])),
            "pickup_time": o.get("pickup_time", ""),
            "created_at": o["created_at"].isoformat(),
        })

    # Low stock products
    low_stock_pipeline = [
        {"$match": {"shop_id": shop_id, "$expr": {"$lte": ["$stock", {"$ifNull": ["$low_stock_threshold", 5]}]}}},
        {"$project": {"_id": 1, "name": 1, "stock": 1, "low_stock_threshold": 1}},
        {"$limit": 20}
    ]
    low_stock_cursor = await db["products"].aggregate(low_stock_pipeline).to_list(20)
    low_stock_products = []
    for p in low_stock_cursor:
        low_stock_products.append({
            "id": str(p["_id"]),
            "name": p.get("name", ""),
            "stock": p.get("stock", 0),
            "threshold": p.get("low_stock_threshold", 5)
        })

    return {
        "total_products": total_products,
        "today_orders": today_orders,
        "pending_orders": pending_orders,
        "total_orders": total_orders,
        "today_revenue": round(today_revenue, 2),
        "total_revenue": round(total_revenue, 2),
        "recent_orders": recent,
        "low_stock_products": low_stock_products,
    }


@router.get("/reports")
async def shopkeeper_reports(
    current_user: dict = Depends(require_role(["shopkeeper"])),
):
    db = get_db()
    shop_id = to_object_id(current_user["shop_id"])

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    async def get_revenue(start_date):
        pipeline = [
            {"$match": {"shop_id": shop_id, "created_at": {"$gte": start_date}, "status": {"$nin": ["cancelled", "rejected"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}},
        ]
        result = await db["orders"].aggregate(pipeline).to_list(1)
        return result[0] if result else {"total": 0, "count": 0}

    today_stats = await get_revenue(today_start)
    week_stats = await get_revenue(week_start)
    month_stats = await get_revenue(month_start)

    # All time
    all_pipeline = [
        {"$match": {"shop_id": shop_id, "status": {"$nin": ["cancelled", "rejected"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}},
    ]
    all_result = await db["orders"].aggregate(all_pipeline).to_list(1)
    all_stats = all_result[0] if all_result else {"total": 0, "count": 0}

    # Daily breakdown for last 7 days
    daily = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_pipeline = [
            {"$match": {"shop_id": shop_id, "created_at": {"$gte": day_start, "$lt": day_end}, "status": {"$nin": ["cancelled", "rejected"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}, "count": {"$sum": 1}}},
        ]
        day_result = await db["orders"].aggregate(day_pipeline).to_list(1)
        day_data = day_result[0] if day_result else {"total": 0, "count": 0}
        daily.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "label": day_start.strftime("%a"),
            "revenue": round(day_data["total"], 2),
            "orders": day_data["count"],
        })

    # Top products
    top_pipeline = [
        {"$match": {"shop_id": shop_id, "status": {"$nin": ["cancelled", "rejected"]}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "total_quantity": {"$sum": "$items.quantity"}, "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}}},
        {"$sort": {"total_quantity": -1}},
        {"$limit": 5},
    ]
    top_products = await db["orders"].aggregate(top_pipeline).to_list(5)

    return {
        "today": {"revenue": round(today_stats.get("total", 0), 2), "orders": today_stats.get("count", 0)},
        "this_week": {"revenue": round(week_stats.get("total", 0), 2), "orders": week_stats.get("count", 0)},
        "this_month": {"revenue": round(month_stats.get("total", 0), 2), "orders": month_stats.get("count", 0)},
        "all_time": {"revenue": round(all_stats.get("total", 0), 2), "orders": all_stats.get("count", 0)},
        "daily_breakdown": daily,
        "top_products": [{"name": p["_id"], "quantity": p["total_quantity"], "revenue": round(p["total_revenue"], 2)} for p in top_products],
    }
