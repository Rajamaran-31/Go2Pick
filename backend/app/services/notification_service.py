from datetime import datetime, timezone
from app.database import get_db

from typing import Optional

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
    await create_notification(
        user_id=shopkeeper_user_id,
        title="New Order Received",
        message=f"New order from {customer_name}. Order ID: {order_id}",
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
