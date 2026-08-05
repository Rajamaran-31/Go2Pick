from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.category import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryResponse])
async def list_categories():
    db = get_db()
    categories = await db["categories"].find().sort("name", 1).to_list(100)

    result = []
    for cat in categories:
        shop_count = await db["shops"].count_documents({"category": cat["name"], "is_active": True})
        result.append(
            CategoryResponse(
                id=str(cat["_id"]),
                name=cat["name"],
                image=cat.get("image"),
                description=cat.get("description"),
                shop_count=shop_count,
            )
        )
    return result
