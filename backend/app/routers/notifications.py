from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── GET /notifications ───────────────────────────────────────────────────────

@router.get("/")
@router.get("")
async def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = str(current_user["_id"])
    role = current_user.get("role", "customer")

    coll_ref = db.collection("notifications")
    all_docs = []

    if role == "super_admin":
        docs1 = list(coll_ref.where("recipientRole", "==", "super_admin").stream())
        docs2 = list(coll_ref.where("recipientId", "==", user_id).stream())
        docs3 = list(coll_ref.where("userId", "==", user_id).stream())
        
        seen = set()
        for d in docs1 + docs2 + docs3:
            if d.id not in seen:
                all_docs.append(d)
                seen.add(d.id)
    else:
        docs1 = list(coll_ref.where("recipientId", "==", user_id).stream())
        docs2 = list(coll_ref.where("userId", "==", user_id).stream())
        
        seen = set()
        for d in docs1 + docs2:
            if d.id not in seen:
                if d.to_dict().get("recipientRole") != "super_admin":
                    all_docs.append(d)
                    seen.add(d.id)

    if unread_only:
        all_docs = [d for d in all_docs if d.to_dict().get("isRead") == False]

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val
        
    all_docs.sort(key=get_created_at, reverse=True)

    total = len(all_docs)
    paginated_docs = all_docs[skip : skip + limit]

    if unread_only:
        unread_count = total
    else:
        unread_count = sum(1 for d in all_docs if d.to_dict().get("isRead") == False)

    def _fmt(doc_snap):
        n = doc_snap.to_dict()
        return {
            "id": doc_snap.id,
            "userId": str(n.get("recipientId") or n.get("userId") or ""),
            "recipientId": str(n.get("recipientId") or n.get("userId") or ""),
            "recipientRole": n.get("recipientRole"),
            "title": n.get("title", ""),
            "message": n.get("message", ""),
            "type": n.get("type"),
            "actionLabel": n.get("actionLabel"),
            "actionType": n.get("actionType"),
            "isRead": n.get("isRead", False),
            "createdAt": n.get("createdAt"),
        }

    return {
        "success": True,
        "total": total,
        "unreadCount": unread_count,
        "notifications": [_fmt(doc) for doc in paginated_docs],
    }


# ─── POST /notifications/{id}/read ────────────────────────────────────────────

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    doc_ref = db.collection("notifications").document(notification_id)
    doc_snap = doc_ref.get()
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif = doc_snap.to_dict()
    notif_user_id = str(notif.get("recipientId") or notif.get("userId") or "")
    notif_role = notif.get("recipientRole")
    
    can_read = False
    if current_user.get("role") == "super_admin" and notif_role == "super_admin":
        can_read = True
    elif notif_user_id == user_id:
        can_read = True
        
    if not can_read:
        raise HTTPException(status_code=403, detail="Access denied")

    doc_ref.update({"isRead": True})

    return {"success": True, "message": "Notification marked as read"}


# ─── POST /notifications/read-all ─────────────────────────────────────────────

@router.post("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    role = current_user.get("role", "customer")
    coll_ref = db.collection("notifications")

    docs_to_update = []
    seen = set()
    if role == "super_admin":
        docs1 = list(coll_ref.where("recipientRole", "==", "super_admin").stream())
        docs2 = list(coll_ref.where("recipientId", "==", user_id).stream())
        
        for d in docs1 + docs2:
            if d.id not in seen:
                n = d.to_dict()
                if n.get("isRead") == False:
                    docs_to_update.append(d)
                    seen.add(d.id)
    else:
        docs1 = list(coll_ref.where("recipientId", "==", user_id).stream())
        
        for d in docs1:
            if d.id not in seen:
                n = d.to_dict()
                if n.get("isRead") == False and n.get("recipientRole") != "super_admin":
                    docs_to_update.append(d)
                    seen.add(d.id)

    batch = db.batch()
    count = 0
    for doc in docs_to_update:
        batch.update(doc.reference, {"isRead": True})
        count += 1
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
    if count > 0:
        batch.commit()

    return {"success": True, "message": "All notifications marked as read"}
