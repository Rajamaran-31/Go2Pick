from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import random
import string
from firebase_admin.firestore import Query as FirestoreQuery

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/support", tags=["Support"])


class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=5, max_length=200)
    category: str = "general"
    priority: str = "low"
    description: Optional[str] = None
    message: Optional[str] = None
    userId: Optional[str] = None
    role: Optional[str] = "customer"
    supportContext: Optional[str] = None  # "customer" or "shopkeeper"
    shopId: Optional[str] = None
    shopName: Optional[str] = None
    status: Optional[str] = "open"
    createdAt: Optional[str] = None
    attachments: Optional[List[str]] = []


# ─── POST /support/tickets ────────────────────────────────────────────────────

@router.post("/tickets", status_code=201)
async def create_ticket(body: CreateTicketRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # 6. Debug logs: support ticket submit payload
    print(f"[DEBUG LOG] support ticket submit payload: {body.dict()}")

    user_id = body.userId or str(current_user["_id"])
    role = body.role or "customer"
    # Derive supportContext: use explicit value, else fall back to role
    support_context = body.supportContext or role
    status = body.status or "open"
    priority = body.priority or "low"
    category = body.category or "general"
    subject = body.subject
    desc = body.description or body.message
    
    if not desc or len(desc) < 10:
        raise HTTPException(status_code=400, detail="Description/message is required and must be at least 10 characters.")

    shop_id = body.shopId
    shop_name = body.shopName

    if role == "shopkeeper" and (not shop_id or not shop_name):
        shops_ref = db.collection("shops").where("ownerId", "==", user_id).stream()
        shops = list(shops_ref)
        if shops:
            if not shop_id:
                shop_id = shops[0].id
            if not shop_name:
                shop_data = shops[0].to_dict()
                shop_name = shop_data.get("name") or shop_data.get("shopName")

    ticket_num = "TKT-" + "".join(random.choices(string.digits, k=6))
    
    now = datetime.now(timezone.utc)
    if body.createdAt:
        try:
            created_dt = datetime.fromisoformat(body.createdAt.replace("Z", "+00:00"))
        except Exception:
            created_dt = now
    else:
        created_dt = now

    doc_ref = db.collection("support_tickets").document()
    ticket_id = doc_ref.id

    ticket_doc = {
        "ticketId": ticket_id,
        "userId": user_id,
        "role": role,
        "supportContext": support_context,
        "shopId": shop_id,
        "shopName": shop_name,
        "ticketNumber": ticket_num,
        "userName": current_user.get("fullName", current_user.get("name", "")),
        "subject": subject,
        "message": desc,
        "description": desc,
        "category": category,
        "priority": priority,
        "status": status,
        "attachments": body.attachments or [],
        "adminNotes": "",
        "conversation": [
            {
                "senderId": user_id,
                "senderName": current_user.get("fullName", current_user.get("name", "User")),
                "senderRole": role,
                "message": desc,
                "createdAt": created_dt.isoformat() if hasattr(created_dt, "isoformat") else str(created_dt),
                "attachments": body.attachments or []
            }
        ],
        "createdAt": created_dt,
        "updatedAt": now,
    }

    doc_ref.set(ticket_doc)

    # 6. Debug logs: backend saved ticket ID
    print(f"[DEBUG LOG] backend saved ticket ID: {ticket_id}")

    # 5. Notification to Super Admin
    try:
        from app.services.notification_service import create_notification
        await create_notification(
            user_id=None,
            title="New Shopkeeper Support Ticket",
            message="A shopkeeper submitted a support request.",
            type="SUPPORT_TICKET",
            action_type="VIEW_SUPPORT_TICKETS",
            recipient_role="super_admin"
        )
    except Exception as e:
        print(f"[WARN] Failed to create admin notification: {e}")

    return {
        "success": True,
        "ticketId": ticket_id,
        "ticketNumber": ticket_num,
        "message": "Support ticket submitted successfully",
    }


# ─── GET /support/tickets ─────────────────────────────────────────────────────

@router.get("/tickets")
async def my_tickets(
    context: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = str(current_user["_id"])

    docs = list(db.collection("support_tickets").where("userId", "==", user_id).stream())
    
    # Filter by supportContext if provided
    if context:
        filtered = []
        for d in docs:
            t = d.to_dict()
            sc = t.get("supportContext") or t.get("role", "customer")
            if sc == context:
                filtered.append(d)
        docs = filtered
    
    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val
    docs.sort(key=get_created_at, reverse=True)
    paginated_docs = docs[:50]

    def _fmt(doc_snap):
        t = doc_snap.to_dict()
        return {
            "id": doc_snap.id,
            "ticketNumber": t.get("ticketNumber", ""),
            "subject": t.get("subject", ""),
            "message": t.get("message", ""),
            "category": t.get("category", ""),
            "priority": t.get("priority", "low"),
            "status": t.get("status", "open"),
            "supportContext": t.get("supportContext") or t.get("role", "customer"),
            "createdAt": t.get("createdAt"),
            "updatedAt": t.get("updatedAt", t.get("createdAt")),
        }

    return {"success": True, "tickets": [_fmt(t) for t in paginated_docs]}


# ─── GET /support/my-tickets ──────────────────────────────────────────────────

@router.get("/my-tickets")
async def get_my_tickets(
    context: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = str(current_user["_id"])
    
    docs = list(db.collection("support_tickets").where("userId", "==", user_id).stream())
    
    # Filter by supportContext if provided
    if context:
        filtered = []
        for d in docs:
            t = d.to_dict()
            sc = t.get("supportContext") or t.get("role", "customer")
            if sc == context:
                filtered.append(d)
        docs = filtered
    
    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val
    docs.sort(key=get_created_at, reverse=True)
    
    def _fmt(doc_snap):
        t = doc_snap.to_dict()
        return {
            "id": doc_snap.id,
            "ticketNumber": t.get("ticketNumber", f"TKT-{doc_snap.id[:6].upper()}"),
            "subject": t.get("subject", ""),
            "category": t.get("category", "general"),
            "priority": t.get("priority", "low"),
            "status": t.get("status", "open"),
            "supportContext": t.get("supportContext") or t.get("role", "customer"),
            "createdAt": t.get("createdAt"),
            "updatedAt": t.get("updatedAt", t.get("createdAt")),
        }
        
    return {"success": True, "tickets": [_fmt(d) for d in docs]}


# ─── POST /support/migrate-tickets ────────────────────────────────────────────
# Repair old tickets: set supportContext based on role field if missing

@router.post("/migrate-tickets")
async def migrate_old_tickets(current_user: dict = Depends(get_current_user)):
    """Repair old tickets that don't have supportContext by deriving it from role."""
    is_admin = current_user.get("role") in ["admin", "super_admin"]
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can run migration")
    
    db = get_db()
    all_docs = list(db.collection("support_tickets").stream())
    updated = 0
    for doc in all_docs:
        t = doc.to_dict()
        if not t.get("supportContext"):
            role = t.get("role", "customer")
            context = "shopkeeper" if role == "shopkeeper" else "customer"
            doc.reference.update({"supportContext": context})
            updated += 1
    return {"success": True, "updated": updated, "message": f"Repaired {updated} tickets"}


# ─── GET /support/tickets/{ticketId} ──────────────────────────────────────────

@router.get("/tickets/{ticketId}")
async def get_ticket_details(ticketId: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc_snap = db.collection("support_tickets").document(ticketId).get()
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    t = doc_snap.to_dict()
    ticket_user_id = t.get("userId")
    
    # Authorization check
    is_admin = current_user.get("role") in ["admin", "super_admin"]
    if not is_admin and str(current_user["_id"]) != str(ticket_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    
    # Fetch user details
    user_info = {}
    if ticket_user_id:
        u_snap = db.collection("users").document(ticket_user_id).get()
        if u_snap.exists:
            u_data = u_snap.to_dict()
            user_info = {
                "name": u_data.get("fullName", u_data.get("name", "")),
                "email": u_data.get("email", ""),
                "role": u_data.get("role", "customer")
            }
    if not user_info:
        user_info = {
            "name": t.get("userName", ""),
            "email": "",
            "role": t.get("role", "customer")
        }
    
    # Fetch Shop Name if needed
    shop_name = t.get("shopName")
    if not shop_name and t.get("shopId"):
        s_snap = db.collection("shops").document(t.get("shopId")).get()
        if s_snap.exists:
            shop_name = s_snap.to_dict().get("name")
            
    def serialize_dt(dt):
        if isinstance(dt, datetime):
            return dt.isoformat()
        return str(dt)
        
    formatted = {
        "id": ticketId,
        "ticketId": ticketId,
        "userId": ticket_user_id,
        "userName": t.get("userName", user_info.get("name")),
        "email": user_info.get("email", ""),
        "role": t.get("role", "customer"),
        "shopId": t.get("shopId"),
        "shopName": shop_name,
        "ticketNumber": t.get("ticketNumber", f"TKT-{ticketId[:6].upper()}"),
        "subject": t.get("subject", ""),
        "message": t.get("message", t.get("description", "")),
        "description": t.get("description", t.get("message", "")),
        "category": t.get("category", "general"),
        "priority": t.get("priority", "low"),
        "status": t.get("status", "open"),
        "adminNotes": t.get("adminNotes", ""),
        "attachments": t.get("attachments", []),
        "conversation": t.get("conversation", []),
        "createdAt": serialize_dt(t.get("createdAt")),
        "updatedAt": serialize_dt(t.get("updatedAt")),
        "user": user_info
    }
    return formatted


# ─── POST /support/tickets/{ticketId}/reply ───────────────────────────────────

class TicketReplyRequest(BaseModel):
    message: str
    attachments: Optional[List[str]] = []
    senderRole: Optional[str] = None


@router.post("/tickets/{ticketId}/reply")
async def reply_to_ticket(ticketId: str, body: TicketReplyRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc_ref = db.collection("support_tickets").document(ticketId)
    doc_snap = doc_ref.get()
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    t = doc_snap.to_dict()
    ticket_user_id = t.get("userId")
    
    # Authorization check
    is_admin = current_user.get("role") in ["admin", "super_admin"]
    if not is_admin and str(current_user["_id"]) != str(ticket_user_id):
        raise HTTPException(status_code=403, detail="Not authorized to reply to this ticket")
        
    now = datetime.now(timezone.utc)
    
    sender_role = body.senderRole or current_user.get("role", "customer")
    if is_admin:
        sender_role = "super_admin"

    now = datetime.now(timezone.utc)
    
    new_message = {
        "senderId": str(current_user["_id"]),
        "senderName": current_user.get("fullName", current_user.get("name", "User")),
        "senderRole": sender_role,
        "message": body.message,
        "createdAt": now.isoformat(),
        "timestamp": now.isoformat(),
        "attachments": body.attachments or []
    }
    
    conversation = t.get("conversation", [])
    conversation.append(new_message)
    
    doc_ref.update({
        "conversation": conversation,
        "updatedAt": now
    })
    
    # Notifications
    try:
        from app.services.notification_service import create_notification
        if is_admin:
            # Send notification only to ticket owner
            await create_notification(
                user_id=ticket_user_id,
                title="Support Team Replied",
                message=f"You have received a reply for ticket {ticketId}",
                type="SUPPORT_REPLY",
                recipient_role="shopkeeper"
            )
        else:
            # Send notification only to Super Admin
            await create_notification(
                user_id=None,
                title="New Ticket Reply",
                message=f"User replied to support ticket: '{t.get('subject')}'",
                type="SUPPORT_TICKET_REPLY",
                action_type="VIEW_SUPPORT_TICKET",
                action_label="View Ticket",
                recipient_role="super_admin"
            )
    except Exception as e:
        print(f"[WARN] Failed to create reply notification: {e}")
        
    return {"success": True, "message": "Reply sent successfully"}


# ─── PATCH /support/tickets/{ticketId} ────────────────────────────────────────

class UpdateTicketRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    adminNotes: Optional[str] = None


@router.patch("/tickets/{ticketId}")
async def update_ticket(ticketId: str, body: UpdateTicketRequest, current_user: dict = Depends(get_current_user)):
    is_admin = current_user.get("role") in ["admin", "super_admin"]
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update support tickets")
        
    db = get_db()
    doc_ref = db.collection("support_tickets").document(ticketId)
    doc_snap = doc_ref.get()
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    t = doc_snap.to_dict()
    
    updates = {}
    now = datetime.now(timezone.utc)
    conversation = t.get("conversation", [])
    
    if body.status is not None:
        new_status = body.status.lower()
        old_status = t.get("status", "open").lower()
        if new_status != old_status:
            updates["status"] = new_status
            
            # Timeline event: Admin Update
            conversation.append({
                "senderId": str(current_user["_id"]),
                "senderName": current_user.get("fullName", "System"),
                "senderRole": "system",
                "message": f"changed status to {new_status.upper()}",
                "createdAt": now.isoformat(),
                "type": "status_update",
                "status": new_status.upper()
            })
            updates["conversation"] = conversation
            
    if body.priority is not None:
        updates["priority"] = body.priority.lower()
        
    if body.adminNotes is not None:
        updates["adminNotes"] = body.adminNotes
        
    if updates:
        updates["updatedAt"] = now
        doc_ref.update(updates)
        
    return {"success": True, "message": "Ticket updated successfully"}
