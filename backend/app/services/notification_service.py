from datetime import datetime, timezone
from typing import Optional
from firebase_admin import messaging as firebase_messaging
from app.database import get_db

def send_fcm_push(tokens: list, title: str, body: str, data: Optional[dict] = None):
    if not tokens:
        return
    try:
        webpush_config = firebase_messaging.WebpushConfig(
            headers={'Urgency': 'high'},
            notification=firebase_messaging.WebpushNotification(
                title=title,
                body=body,
                icon='https://go2-pick.vercel.app/icon-192.png',
                badge='https://go2-pick.vercel.app/icon-192.png',
                vibrate=[200, 100, 200],
                require_interaction=True,
            )
        )
        multicast_msg = firebase_messaging.MulticastMessage(
            tokens=tokens,
            notification=firebase_messaging.Notification(
                title=title,
                body=body,
                image='https://go2-pick.vercel.app/logo.png',
            ),
            webpush=webpush_config,
            data={k: str(v) for k, v in (data or {}).items() if v is not None},
        )
        response = firebase_messaging.send_each_for_multicast(multicast_msg)
        print(f"FCM Push sent to {len(tokens)} token(s): {response.success_count} success, {response.failure_count} failure")
    except Exception as e:
        print(f"FCM Push Exception: {e}")


async def create_notification(
    user_id,
    title: str,
    message: str,
    type: str = "info",
    action_label: Optional[str] = None,
    action_type: Optional[str] = None,
    recipient_role: Optional[str] = None,
    email: Optional[str] = None,
) -> None:
    """Insert a notification document across all active databases and trigger FCM push."""
    db = get_db()
    firestore_db = getattr(db, "firestore_db", None)
    mongo_db = getattr(db, "mongo_db", None)

    import uuid
    notif_id = f"notif-{uuid.uuid4().hex[:12]}"
    show_button = action_type == "ENABLE_SHOPKEEPER_DASHBOARD" or type in ["SHOP_APPROVED", "shop_approved"]
    s_user_id = str(user_id).strip() if user_id else None
    s_email = (email or "").strip().lower() if email else None

    # Lookup email and fcmTokens if not provided
    fcm_tokens = []
    if s_user_id and not s_email:
        try:
            user_snap = db.collection("users").document(s_user_id).get()
            if user_snap.exists:
                udata = user_snap.to_dict()
                s_email = (udata.get("email") or "").strip().lower() or None
                fcm_tokens = udata.get("fcmTokens", [])
        except Exception:
            pass

    now_utc = datetime.now(timezone.utc)
    doc = {
        "id": notif_id,
        "userId": s_user_id,
        "recipientId": s_user_id,
        "recipientEmail": s_email,
        "email": s_email,
        "recipientRole": recipient_role,
        "title": title,
        "message": message,
        "type": type,
        "actionLabel": action_label,
        "actionType": action_type,
        "show_get_access_button": show_button,
        "isRead": False,
        "createdAt": now_utc,
    }

    # 1. Primary wrapper add
    try:
        db.collection("notifications").document(notif_id).set(doc)
    except Exception as pe:
        print(f"[WARN] Primary notification write error: {pe}")

    # 2. Direct MongoDB write
    if mongo_db is not None:
        try:
            mongo_db["notifications"].replace_one(
                {"_id": notif_id},
                {**doc, "_id": notif_id, "createdAt": now_utc.isoformat()},
                upsert=True
            )
        except Exception as me:
            print(f"[WARN] MongoDB notification write error: {me}")

    # 3. Direct Firestore write
    if firestore_db is not None:
        try:
            firestore_db.collection("notifications").document(notif_id).set(doc)
        except Exception as fe:
            print(f"[WARN] Firestore notification write error: {fe}")

    # Dispatch FCM push notification to user's registered device tokens
    try:
        if s_user_id and not fcm_tokens:
            try:
                user_snap = db.collection("users").document(s_user_id).get()
                if user_snap.exists:
                    fcm_tokens = user_snap.to_dict().get("fcmTokens", [])
            except Exception:
                pass
        if fcm_tokens:
            send_fcm_push(
                tokens=fcm_tokens,
                title=title,
                body=message,
                data={
                    "type": type or "info",
                    "actionType": action_type or "",
                    "actionLabel": action_label or "",
                }
            )
    except Exception as err:
        print("Failed to dispatch FCM push notification:", err)


async def notify_super_admins_new_application() -> None:
    await create_notification(
        user_id=None,
        title="New Shopkeeper Application",
        message="A customer submitted a shopkeeper dashboard request.",
        type="SHOPKEEPER_APPLICATION",
        action_label="View Shop Applications",
        action_type="VIEW_SHOP_APPLICATIONS",
        recipient_role="super_admin",
    )


async def notify_shopkeeper_approved(user_id, shop_name: str, email: Optional[str] = None) -> None:
    display_name = shop_name or "store"
    await create_notification(
        user_id=user_id,
        email=email,
        title="Shop Approved 🎉",
        message=f"Your shop '{display_name}' has been approved by Super Admin!",
        type="SHOP_APPROVED",
        action_label="Get Access to Shopkeeper Dashboard",
        action_type="ENABLE_SHOPKEEPER_DASHBOARD",
        recipient_role="customer",
    )


async def notify_shopkeeper_rejected(user_id, shop_name: str, reason: str, email: Optional[str] = None) -> None:
    await create_notification(
        user_id=user_id,
        email=email,
        title="Shop Application Rejected",
        message=f"Your application for '{shop_name}' was rejected. Reason: {reason}",
        type="shop_rejected",
        recipient_role="customer",
    )


async def notify_new_order(shopkeeper_user_id, order_id: str, customer_name: str) -> None:
    order_code_short = order_id[-6:].upper()
    await create_notification(
        user_id=shopkeeper_user_id,
        title="🚨 New Incoming Order Received!",
        message=f"Customer {customer_name} placed a new order (Order #{order_code_short}). Tap to view!",
        type="new_order",
        action_label="View Order",
        action_type="VIEW_ORDER",
    )


async def notify_order_status(customer_id, status: str, shop_name: str) -> None:
    status_messages = {
        "accepted": f"Your order from {shop_name} has been accepted!",
        "preparing": f"Your order from {shop_name} is being prepared.",
        "ready_for_pickup": f"Your order from {shop_name} is ready for pickup!",
        "completed": f"Your order from {shop_name} has been successfully picked up and completed. Enjoy!",
        "cancelled": f"Your order from {shop_name} has been cancelled.",
    }
    message = status_messages.get(status, f"Order status updated to: {status}")
    title_map = {
        "accepted": "Order Accepted ✅",
        "preparing": "Order Being Prepared 🍳",
        "ready_for_pickup": "Ready for Pickup! 📦",
        "completed": "Order Completed 🎉",
        "cancelled": "Order Cancelled ❌",
    }
    await create_notification(
        user_id=customer_id,
        title=title_map.get(status, "Order Update"),
        message=message,
        type="order_update",
    )
