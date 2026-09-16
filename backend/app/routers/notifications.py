from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone

from pydantic import BaseModel

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class FCMTokenRequest(BaseModel):
    token: str


@router.post("/register-fcm-token")
async def register_fcm_token(
    payload: FCMTokenRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = str(current_user["_id"])
    token_str = payload.token.strip()

    if not token_str:
        raise HTTPException(status_code=400, detail="Token cannot be empty")

    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()

    if user_doc.exists:
        tokens = user_doc.to_dict().get("fcmTokens", [])
        if token_str not in tokens:
            tokens.append(token_str)
            user_ref.update({"fcmTokens": tokens, "updatedAt": datetime.now(timezone.utc)})
    else:
        user_ref.set({
            "fcmTokens": [token_str],
            "updatedAt": datetime.now(timezone.utc)
        }, merge=True)

    return {"success": True, "message": "FCM Token registered successfully"}


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
    user_id = str(current_user["_id"]).strip()
    user_email = (current_user.get("email") or "").strip().lower()
    role = current_user.get("role", "customer")
    firestore_db = getattr(db, "firestore_db", None)
    mongo_db = getattr(db, "mongo_db", None)
    fs_ref = firestore_db or (db if not hasattr(db, "mongo_db") else None)

    raw_notifications = []

    # 1. Primary wrapper stream
    coll_ref = db.collection("notifications")
    try:
        if role == "super_admin":
            for d in coll_ref.where("recipientRole", "==", "super_admin").stream():
                raw_notifications.append(d.to_dict())
            for d in coll_ref.where("recipientId", "==", user_id).stream():
                raw_notifications.append(d.to_dict())
            for d in coll_ref.where("userId", "==", user_id).stream():
                raw_notifications.append(d.to_dict())
        else:
            for d in coll_ref.where("recipientId", "==", user_id).stream():
                raw_notifications.append(d.to_dict())
            for d in coll_ref.where("userId", "==", user_id).stream():
                raw_notifications.append(d.to_dict())
            if user_email:
                for d in coll_ref.where("recipientEmail", "==", user_email).stream():
                    raw_notifications.append(d.to_dict())
                for d in coll_ref.where("email", "==", user_email).stream():
                    raw_notifications.append(d.to_dict())
    except Exception as pe:
        print(f"[WARN] Primary notifications fetch error: {pe}")

    # 2. MongoDB notifications
    if mongo_db is not None:
        try:
            if role == "super_admin":
                m_q = {"$or": [{"recipientRole": "super_admin"}, {"recipientId": user_id}, {"userId": user_id}]}
            else:
                m_conditions = [{"recipientId": user_id}, {"userId": user_id}]
                if user_email:
                    m_conditions.extend([{"recipientEmail": user_email}, {"email": user_email}])
                m_q = {"$or": m_conditions}
            for d in mongo_db["notifications"].find(m_q):
                d["id"] = str(d.get("_id") or d.get("id") or "")
                raw_notifications.append(d)
        except Exception as me:
            print(f"[WARN] Mongo notifications fetch error: {me}")

    # 3. Direct Firestore fetch
    if fs_ref is not None:
        try:
            if role == "super_admin":
                for d in fs_ref.collection("notifications").where("recipientRole", "==", "super_admin").stream():
                    raw_notifications.append(d.to_dict())
                for d in fs_ref.collection("notifications").where("recipientId", "==", user_id).stream():
                    raw_notifications.append(d.to_dict())
                for d in fs_ref.collection("notifications").where("userId", "==", user_id).stream():
                    raw_notifications.append(d.to_dict())
            else:
                for d in fs_ref.collection("notifications").where("recipientId", "==", user_id).stream():
                    raw_notifications.append(d.to_dict())
                for d in fs_ref.collection("notifications").where("userId", "==", user_id).stream():
                    raw_notifications.append(d.to_dict())
                if user_email:
                    for d in fs_ref.collection("notifications").where("recipientEmail", "==", user_email).stream():
                        raw_notifications.append(d.to_dict())
                    for d in fs_ref.collection("notifications").where("email", "==", user_email).stream():
                        raw_notifications.append(d.to_dict())
        except Exception as fe:
            print(f"[WARN] Firestore notifications fetch error: {fe}")

    # Deduplicate by notification id
    seen_ids = set()
    unique_notifications = []
    for n in raw_notifications:
        nid = str(n.get("id") or n.get("_id") or "")
        # Filter super_admin broadcasts for non-super-admins
        if role != "super_admin" and n.get("recipientRole") == "super_admin":
            continue
        if nid and nid not in seen_ids:
            seen_ids.add(nid)
            unique_notifications.append(n)

    if unread_only:
        unique_notifications = [n for n in unique_notifications if n.get("isRead") is not True]

    def get_created_at(n):
        val = n.get("createdAt")
        return str(val) if val else ""

    unique_notifications.sort(key=get_created_at, reverse=True)

    total = len(unique_notifications)
    unread_count = sum(1 for n in unique_notifications if n.get("isRead") is not True)
    paginated_list = unique_notifications[skip : skip + limit]

    def _fmt(n):
        ntype = n.get("type", "info")
        act_type = n.get("actionType")
        is_shop_approval = (
            ntype in ["SHOP_APPROVED", "shop_approved"] or
            act_type == "ENABLE_SHOPKEEPER_DASHBOARD" or
            n.get("show_get_access_button") is True
        )
        return {
            "id": str(n.get("id") or n.get("_id") or ""),
            "userId": str(n.get("recipientId") or n.get("userId") or user_id),
            "recipientId": str(n.get("recipientId") or n.get("userId") or user_id),
            "recipientRole": n.get("recipientRole"),
            "email": n.get("recipientEmail") or n.get("email"),
            "recipientEmail": n.get("recipientEmail") or n.get("email"),
            "title": n.get("title", ""),
            "message": n.get("message", ""),
            "type": "SHOP_APPROVED" if is_shop_approval else ntype,
            "actionLabel": n.get("actionLabel") or ("Get Access to Shopkeeper Dashboard" if is_shop_approval else None),
            "actionType": "ENABLE_SHOPKEEPER_DASHBOARD" if is_shop_approval else act_type,
            "show_get_access_button": is_shop_approval,
            "isRead": bool(n.get("isRead", False)),
            "createdAt": str(n.get("createdAt", "")),
        }

    return {
        "success": True,
        "total": total,
        "unreadCount": unread_count,
        "notifications": [_fmt(n) for n in paginated_list],
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
