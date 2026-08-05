from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.utils.object_id import to_object_id
from app.models.review import ReviewCreate

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@router.get("")
async def list_reviews(
    shop_id: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    db = get_db()
    query = {"status": "approved"}
    if shop_id:
        query["shop_id"] = to_object_id(shop_id)

    reviews = await db["reviews"].find(query).sort("created_at", -1).limit(limit).to_list(limit)
    result = []
    for r in reviews:
        result.append({
            "id": str(r["_id"]),
            "user_id": str(r["user_id"]),
            "shop_id": str(r["shop_id"]),
            "customer_name": r.get("customer_name", "Anonymous"),
            "shop_name": r.get("shop_name", ""),
            "rating": r.get("rating", 5),
            "review_text": r.get("review_text", ""),
            "status": r.get("status", "approved"),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else ""
        })
    return result

@router.post("")
async def create_review(
    review_data: ReviewCreate,
    current_user: dict = Depends(require_role(["customer"]))
):
    db = get_db()
    shop = await db["shops"].find_one({"_id": to_object_id(review_data.shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    review_doc = {
        "user_id": to_object_id(current_user["_id"]),
        "shop_id": to_object_id(review_data.shop_id),
        "customer_name": current_user["name"],
        "shop_name": shop["name"],
        "rating": review_data.rating,
        "review_text": review_data.review_text,
        "status": "approved",
        "created_at": datetime.now(timezone.utc)
    }

    if review_data.product_id:
        review_doc["product_id"] = to_object_id(review_data.product_id)

    await db["reviews"].insert_one(review_doc)

    # Recalculate average rating for shop
    pipeline = [
        {"$match": {"shop_id": to_object_id(review_data.shop_id), "status": "approved"}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    agg_result = await db["reviews"].aggregate(pipeline).to_list(1)
    
    if agg_result:
        avg_rating = agg_result[0]["avg_rating"]
        total_reviews = agg_result[0]["count"]
        await db["shops"].update_one(
            {"_id": to_object_id(review_data.shop_id)},
            {"$set": {"rating": round(avg_rating, 1), "total_reviews": total_reviews}}
        )

    return {"message": "Review submitted successfully"}
