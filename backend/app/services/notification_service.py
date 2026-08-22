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
                icon='/favicon.ico',
                badge='/favicon.ico',
                vibrate=[200, 100, 200],
                require_interaction=True,
            )
        )
        multicast_msg = firebase_messaging.MulticastMessage(
            tokens=tokens,
            notification=firebase_messaging.Notification(
                title=title,
                body=body,
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
) -> None:
    """Insert a notification document for a user in Cloud Firestore."""
    db = get_db()
    doc = {
        "userId": str(user_id) if user_id else None,
        "recipientId": str(user_id) if user_id else None,
        "recipientRole": recipient_role,
        "title": title,
        "message": message,
        "type": type,
        "actionLabel": action_label,
        "actionType": action_type,
        "isRead": False,
        "createdAt": datetime.now(timezone.utc),
    }
    db.collection("notifications").add(doc)

    # Dispatch FCM push notification to user's registered device tokens
    try:
        if user_id:
            user_snap = db.collection("users").document(str(user_id)).get()
            if user_snap.exists:
                user_data = user_snap.to_dict()
                fcm_tokens = user_data.get("fcmTokens", [])
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

async def notify_shopkeeper_approved(user_id, shop_name: str) -> None:
    await create_notification(
        user_id=user_id,
        title="Shop Approved",
        message="Your shop has been approved.",
        type="SHOP_APPROVED",
        action_label="Get Shopkeeper Dashboard",
        action_type="ENABLE_SHOPKEEPER_DASHBOARD",
    )


async def notify_shopkeeper_rejected(user_id, shop_name: str, reason: str) -> None:
    await create_notification(
        user_id=user_id,
        title="Shop Application Rejected",
        message=f"Your application for '{shop_name}' was rejected. Reason: {reason}",
        type="shop_rejected",
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
