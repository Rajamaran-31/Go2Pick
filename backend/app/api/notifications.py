from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def notification_to_response(notif: dict) -> dict:
    return {
        "id": str(notif["_id"]),
        "user_id": str(notif["user_id"]),
        "type": notif.get("type", "general"),
        "title": notif.get("title", ""),
        "message": notif.get("message", ""),
        "is_read": notif.get("is_read", False),
        "show_get_access_button": notif.get("show_get_access_button", False),
        "created_at": notif.get("created_at", datetime.now(timezone.utc)).isoformat()
    }

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db["notifications"].find({"user_id": to_object_id(str(current_user["_id"]))}).sort("created_at", -1)
    notifications = await cursor.to_list(100)
    return [notification_to_response(n) for n in notifications]

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db["notifications"].update_one(
        {
            "_id": to_object_id(notification_id), 
            "user_id": to_object_id(str(current_user["_id"]))
        },
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"success": True, "message": "Notification marked as read"}
