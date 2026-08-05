from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.shop import ShopResponse, ShopUpdate

router = APIRouter(prefix="/api/shops", tags=["Shops"])


def shop_to_response(shop: dict) -> ShopResponse:
    return ShopResponse(
        id=str(shop["_id"]),
        owner_id=str(shop["owner_id"]),
        name=shop["name"],
        category=shop.get("category", ""),
        address=shop.get("address", ""),
        image=shop.get("image"),
        description=shop.get("description"),
        opening_time=shop.get("opening_time", "09:00"),
        closing_time=shop.get("closing_time", "21:00"),
        phone=shop.get("phone"),
        email=shop.get("email"),
        is_active=shop.get("is_active", True),
        rating=shop.get("rating", 4.0),
        total_orders=shop.get("total_orders", 0),
        created_at=shop.get("created_at", datetime.now(timezone.utc)),
    )


@router.get("/featured", response_model=List[ShopResponse])
async def get_featured_shops():
    db = get_db()
    shops = await db["shops"].find({"is_active": True}).sort("rating", -1).limit(10).to_list(10)
    return [shop_to_response(s) for s in shops]


@router.get("/", response_model=List[ShopResponse])
async def list_shops(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    skip: int = Query(default=0, ge=0),
):
    db = get_db()
    query = {"is_active": True}

    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"address": {"$regex": search, "$options": "i"}},
        ]

    shops = await db["shops"].find(query).sort("rating", -1).skip(skip).limit(limit).to_list(limit)
    return [shop_to_response(s) for s in shops]


@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: str):
    db = get_db()
    try:
        shop = await db["shops"].find_one({"_id": to_object_id(shop_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid shop ID")

    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop_to_response(shop)


@router.put("/{shop_id}", response_model=ShopResponse)
async def update_shop(
    shop_id: str,
    update_data: ShopUpdate,
    current_user: dict = Depends(require_role(["shopkeeper", "admin"])),
):
    db = get_db()
    shop = await db["shops"].find_one({"_id": to_object_id(shop_id)})
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    if current_user["role"] == "shopkeeper" and str(shop["owner_id"]) != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your shop")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db["shops"].update_one({"_id": to_object_id(shop_id)}, {"$set": update_dict})
    updated = await db["shops"].find_one({"_id": to_object_id(shop_id)})
    return shop_to_response(updated)
