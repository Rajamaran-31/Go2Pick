from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone
import secrets

from app.database import get_db
from app.auth import require_super_admin, get_current_user
from app.utils import to_object_id
from app.schemas import RejectApplicationRequest, PlatformSettingsUpdateRequest
from app.services.notification_service import notify_shopkeeper_approved, notify_shopkeeper_rejected
from app.services.email_service import send_shop_approved_email, send_shop_rejected_email

router = APIRouter(prefix="/admin", tags=["Super Admin"])


# ─── GET /admin/dashboard ─────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(require_super_admin)):
    from app.memory_store import get_all_applications
    db = get_db()

    total_users = 1
    total_shops = 0
    total_orders = 0
    total_revenue = 0.0

    try:
        total_users = sum(1 for doc in db.collection("users").stream() if doc.to_dict().get("role") != "super_admin")
        total_shops = sum(1 for _ in db.collection("shops").stream())
        total_orders = sum(1 for _ in db.collection("orders").stream())
        orders_ref = db.collection("orders").stream()
        for doc in orders_ref:
            d = doc.to_dict()
            if d.get("orderStatus") != "cancelled":
                total_revenue += float(d.get("totalAmount", 0.0))
    except Exception as e:
        print(f"[WARN] Firestore fetch error in admin_dashboard: {e}")

    pending_apps = len(get_all_applications(status="pending"))

    return {
        "success": True,
        "totalUsers": total_users,
        "totalShops": total_shops,
        "totalOrders": total_orders,
        "totalRevenue": round(total_revenue, 2),
        "pendingApplications": pending_apps,
    }


# ─── GET /admin/shopkeeper-requests ───────────────────────────────────────────

@router.get("/shop-applications")
@router.get("/shopkeeper-requests")
async def list_applications(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_super_admin),
):
    from app.memory_store import get_all_applications
    db = get_db()
    apps_list = []
    
    # 1. Fetch from Firestore if available
    try:
        coll_ref = db.collection("shopkeeper_applications")
        query_ref = coll_ref.where("status", "==", status) if status else coll_ref
        docs = list(query_ref.stream())
        for d in docs:
            ad = d.to_dict()
            ad["id"] = d.id
            apps_list.append(ad)
    except Exception as e:
        print(f"[WARN] Firestore fetch error in list_applications: {e}")

    # 2. Merge with memory store applications
    mem_apps = get_all_applications(status)
    for ma in mem_apps:
        apps_list.append(ma)

    seen_ids = set()
    unique_apps = []
    for app in apps_list:
        aid = app.get("id")
        if aid and aid not in seen_ids:
            seen_ids.add(aid)
            unique_apps.append(app)

    total = len(unique_apps)
    paginated = unique_apps[skip : skip + limit]

    result = []
    for app in paginated:
        user_name = app.get("applicantName") or app.get("ownerName") or "Applicant"
        result.append({
            "id": app.get("id"),
            "userId": str(app.get("userId", app.get("applicantId", ""))),
            "applicantName": user_name,
            "applicantEmail": app.get("applicantEmail") or app.get("email") or "",
            "shopName": app.get("shopName", ""),
            "ownerName": app.get("ownerName", user_name),
            "phone": app.get("phone", ""),
            "email": app.get("email", ""),
            "address": app.get("address", ""),
            "city": app.get("city", ""),
            "pincode": app.get("pincode", ""),
            "category": app.get("category", ""),
            "businessProof": app.get("businessProofUrl", app.get("businessProof")),
            "description": app.get("description", ""),
            "status": app.get("status", "pending"),
            "rejectionReason": app.get("rejectionReason"),
            "submittedAt": str(app.get("submittedAt") or app.get("createdAt") or ""),
            "reviewedAt": str(app.get("reviewedAt") or ""),
        })

    return {"success": True, "total": total, "applications": result}


# ─── GET /admin/shopkeeper-requests/{application_id} ──────────────────────────

@router.get("/shop-applications/{application_id}")
@router.get("/shopkeeper-requests/{application_id}")
async def get_application(application_id: str, current_user: dict = Depends(require_super_admin)):
    db = get_db()
    doc_snap = db.collection("shopkeeper_applications").document(application_id).get()
    if not doc_snap.exists:
        raise HTTPException(status_code=404, detail="Application not found")
    app = doc_snap.to_dict()

    user_snap = db.collection("users").document(app.get("userId", "")).get()
    user = user_snap.to_dict() if user_snap.exists else None

    return {
        "success": True,
        "application": {
            "id": doc_snap.id,
            "userId": str(app.get("userId", "")),
            "applicantName": user.get("fullName", user.get("name", "Unknown")) if user else "Unknown",
            "applicantEmail": user.get("email", "") if user else "",
            "shopName": app.get("shopName", ""),
            "ownerName": app.get("ownerName", ""),
            "phone": app.get("phone", ""),
            "email": app.get("email", ""),
            "address": app.get("address", ""),
            "city": app.get("city", ""),
            "pincode": app.get("pincode", ""),
            "category": app.get("category", ""),
            "businessProof": app.get("businessProof"),
            "description": app.get("description"),
            "status": app.get("status", "pending"),
            "rejectionReason": app.get("rejectionReason"),
            "submittedAt": app.get("submittedAt"),
            "reviewedAt": app.get("reviewedAt"),
        },
    }


# ─── PUT /admin/shopkeeper-requests/{application_id}/approve ───────────────────

@router.post("/shop-applications/{application_id}/approve")
@router.put("/shop-applications/{application_id}/approve")
@router.post("/shopkeeper-requests/{application_id}/approve")
@router.put("/shopkeeper-requests/{application_id}/approve")
async def approve_application(application_id: str, current_user: dict = Depends(require_super_admin)):
    from app.memory_store import update_application_status, APPLICATIONS_STORE
    db = get_db()
    now = datetime.now(timezone.utc)

    # 1. Update memory store
    update_application_status(application_id, "approved")
    app = APPLICATIONS_STORE.get(application_id, {})

    # 2. Try Firestore update
    try:
        app_ref = db.collection("shopkeeper_applications").document(application_id)
        app_snap = app_ref.get()
        if app_snap.exists:
            app = app_snap.to_dict()
            app_ref.update({
                "status": "approved",
                "reviewedAt": now,
                "reviewedBy": current_user.get("_id", "admin")
            })
    except Exception as fe:
        print(f"[WARN] Firestore approve error: {fe}")

    shop_id = f"shop-{abs(hash(application_id))}"

    # Try creating shop in Firestore
    try:
        shop_ref = db.collection("shops").document(shop_id)
        shop_doc = {
            "id": shop_id,
            "ownerId": app.get("applicantId", app.get("userId", "")),
            "owner_id": app.get("applicantId", app.get("userId", "")),
            "applicationId": application_id,
            "name": app.get("shopName", "Approved Shop"),
            "shopName": app.get("shopName", "Approved Shop"),
            "category": app.get("category", "General"),
            "description": app.get("description", ""),
            "address": app.get("address", ""),
            "city": app.get("city", ""),
            "pincode": app.get("pincode", ""),
            "businessPhone": app.get("phone", ""),
            "businessEmail": app.get("email", ""),
            "status": "active",
            "isActive": True,
            "is_active": True,
            "isApproved": True,
            "createdAt": now,
            "updatedAt": now,
        }
        shop_ref.set(shop_doc)

        applicant_id = app.get("applicantId", app.get("userId"))
        applicant_email = (app.get("email") or app.get("applicantEmail") or "").lower()
        user_docs = []

        if applicant_id:
            try:
                db.collection("users").document(applicant_id).update({
                    "isShopkeeper": True,
                    "shopkeeperStatus": "approved",
                    "shopkeeperDashboardEnabled": True,
                    "activeShopId": shop_id,
                    "shop_id": shop_id,
                    "updatedAt": now,
                })
            except Exception as e_id:
                print(f"[WARN] Failed to update user by applicant_id {applicant_id}: {e_id}")

        if applicant_email:
            try:
                user_docs = list(db.collection("users").where("email", "==", applicant_email).stream())
                for ud in user_docs:
                    db.collection("users").document(ud.id).update({
                        "isShopkeeper": True,
                        "shopkeeperStatus": "approved",
                        "shopkeeperDashboardEnabled": True,
                        "activeShopId": shop_id,
                        "shop_id": shop_id,
                        "updatedAt": now,
                    })
            except Exception as e_em:
                print(f"[WARN] Failed to update user by email {applicant_email}: {e_em}")

        target_uid = applicant_id or (user_docs[0].id if user_docs else None)
        if target_uid:
            try:
                await notify_shopkeeper_approved(target_uid, app.get("shopName", ""))
            except Exception as notif_e:
                print(f"[WARN] Failed to notify shopkeeper: {notif_e}")
    except Exception as fe2:
        print(f"[WARN] Firestore shop creation error: {fe2}")

    return {
        "success": True,
        "message": "Application approved. Shop created and user notified.",
        "shopId": shop_id,
    }

    # Create the shop
    shop_ref = db.collection("shops").document()
    shop_id = shop_ref.id

    shop_doc = {
        "id": shop_id,
        "ownerId": app.get("applicantId", app.get("userId", "")),
        "owner_id": app.get("applicantId", app.get("userId", "")),
        "applicationId": application_id,
        "name": app.get("shopName", ""),
        "shopName": app.get("shopName", ""),
        "category": app.get("category", ""),
        "description": app.get("description", ""),
        "address": app.get("address", ""),
        "city": app.get("city", ""),
        "pincode": app.get("pincode", ""),
        "businessPhone": app.get("businessPhone", app.get("phone", "")),
        "businessEmail": app.get("businessEmail", app.get("email", "")),
        "phone": app.get("businessPhone", app.get("phone", "")),
        "email": app.get("businessEmail", app.get("email", "")),
        "imageUrl": app.get("shopImageUrl", app.get("shopImage", "")),
        "shopImageUrl": app.get("shopImageUrl", app.get("shopImage", "")),
        "image": app.get("shopImageUrl", app.get("shopImage", "")),
        "businessProofUrl": app.get("businessProofUrl", app.get("businessProof", "")),
        "status": "active",
        "isActive": True,
        "is_active": True,
        "isApproved": True,
        "rating": 0,
        "ratingCount": 0,
        "totalOrders": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    
    shop_ref.set(shop_doc)
    
    print(f"DEBUG [Admin Approve] created shop id: {shop_id}")
    print(f"DEBUG [Admin Approve] created shop data: {shop_doc}")

    # Update application status
    app_ref.update({
        "status": "approved",
        "reviewedAt": now,
        "reviewedBy": current_user["_id"]
    })

    applicant_id = app.get("applicantId", app.get("userId"))
    
    user_snap_before = db.collection("users").document(applicant_id).get()
    print(f"DEBUG [Admin Approve] applicationId: {application_id}")
    print(f"DEBUG [Admin Approve] applicantId: {applicant_id}")
    print(f"DEBUG [Admin Approve] user document before update: {user_snap_before.to_dict() if user_snap_before.exists else 'NOT FOUND'}")

    # Update user parameters
    db.collection("users").document(applicant_id).update({
        "isShopkeeper": True,
        "shopkeeperStatus": "approved",
        "shopkeeperDashboardEnabled": True,
        "activeMode": "customer",
        "activeShopId": shop_id,
        "shop_id": shop_id,
        "updatedAt": now,
    })

    user_snap_after = db.collection("users").document(applicant_id).get()
    print(f"DEBUG [Admin Approve] user document after update: {user_snap_after.to_dict() if user_snap_after.exists else 'NOT FOUND'}")

    # Send in-app notification & SMTP email
    await notify_shopkeeper_approved(applicant_id, app.get("shopName", ""))
    
    user_snap = db.collection("users").document(applicant_id).get()
    if user_snap.exists:
        user = user_snap.to_dict()
        send_shop_approved_email(user.get("email", ""), app.get("shopName", ""))

    return {
        "success": True,
        "message": "Application approved. Shop created. User notified.",
        "shopId": shop_id,
    }


# ─── PUT /admin/shopkeeper-requests/{application_id}/reject ───────────────────

@router.post("/shop-applications/{application_id}/reject")
@router.put("/shop-applications/{application_id}/reject")
@router.post("/shopkeeper-requests/{application_id}/reject")
@router.put("/shopkeeper-requests/{application_id}/reject")
async def reject_application(
    application_id: str,
    body: RejectApplicationRequest,
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()

    app_ref = db.collection("shopkeeper_applications").document(application_id)
    app_snap = app_ref.get()
    if not app_snap.exists:
        raise HTTPException(status_code=404, detail="Application not found")
    app = app_snap.to_dict()
    if app["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Application is already {app['status']}")

    now = datetime.now(timezone.utc)

    # Update application
    app_ref.update({
        "status": "rejected",
        "rejectionReason": body.rejectionReason,
        "reviewedAt": now,
        "reviewedBy": current_user["_id"],
    })

    # Update user status
    db.collection("users").document(app["userId"]).update({
        "shopkeeperStatus": "rejected",
        "rejectionReason": body.rejectionReason,
        "updatedAt": now,
    })

    # Notify user
    await notify_shopkeeper_rejected(app["userId"], app.get("shopName", ""), body.rejectionReason)

    user_snap = db.collection("users").document(app["userId"]).get()
    if user_snap.exists:
        user = user_snap.to_dict()
        send_shop_rejected_email(user.get("email", ""), app.get("shopName", ""), body.rejectionReason)

    return {"success": True, "message": "Application rejected and user notified"}


# ─── GET /admin/shops ─────────────────────────────────────────────────────────

@router.get("/shops")
async def list_shops(
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    all_shops = list(db.collection("shops").stream())

    if search:
        search_lower = search.lower()
        all_shops = [s for s in all_shops if search_lower in s.to_dict().get("shopName", "").lower()]

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_shops.sort(key=get_created_at, reverse=True)
    total = len(all_shops)
    paginated_shops = all_shops[skip : skip + limit]

    result = []
    for s_doc in paginated_shops:
        s = s_doc.to_dict()
        owner_snap = db.collection("users").document(s.get("ownerId", "")).get()
        owner = owner_snap.to_dict() if owner_snap.exists else None
        result.append({
            "id": s_doc.id,
            "shopName": s.get("shopName", ""),
            "category": s.get("category", ""),
            "address": s.get("address", ""),
            "phone": s.get("phone", ""),
            "image": s.get("image"),
            "rating": s.get("rating", 0.0),
            "totalOrders": s.get("totalOrders", 0),
            "isActive": s.get("isActive", True),
            "isApproved": s.get("isApproved", True),
            "ownerName": owner.get("fullName", owner.get("name", "Unknown")) if owner else "Unknown",
            "ownerEmail": owner.get("email", "") if owner else "",
            "createdAt": s.get("createdAt"),
        })

    return {"success": True, "total": total, "shops": result}


# ─── PUT /admin/shops/{shop_id}/block & unblock & toggle ──────────────────────

@router.put("/shops/{shop_id}/block")
async def block_shop(shop_id: str, current_user: dict = Depends(require_super_admin)):
    db = get_db()
    shop_ref = db.collection("shops").document(shop_id)
    if not shop_ref.get().exists:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop_ref.update({"isActive": False, "is_active": False, "updatedAt": datetime.now(timezone.utc)})
    return {"success": True, "message": "Shop blocked"}


@router.put("/shops/{shop_id}/unblock")
async def unblock_shop(shop_id: str, current_user: dict = Depends(require_super_admin)):
    db = get_db()
    shop_ref = db.collection("shops").document(shop_id)
    if not shop_ref.get().exists:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop_ref.update({"isActive": True, "is_active": True, "updatedAt": datetime.now(timezone.utc)})
    return {"success": True, "message": "Shop unblocked"}


@router.put("/shops/{shop_id}/toggle")
async def toggle_shop(shop_id: str, current_user: dict = Depends(require_super_admin)):
    db = get_db()
    shop_ref = db.collection("shops").document(shop_id)
    shop_snap = shop_ref.get()
    if not shop_snap.exists:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop = shop_snap.to_dict()
    new_active = not shop.get("isActive", True)
    shop_ref.update({
        "isActive": new_active,
        "is_active": new_active,
        "updatedAt": datetime.now(timezone.utc)
    })
    return {"success": True, "message": f"Shop {'activated' if new_active else 'deactivated'} successfully"}


# ─── GET /admin/users ─────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    all_users = list(db.collection("users").stream())

    # Filter role != super_admin
    all_users = [u for u in all_users if u.to_dict().get("role") != "super_admin"]

    if role:
        all_users = [u for u in all_users if u.to_dict().get("role") == role]

    if search:
        search_lower = search.lower()
        all_users = [
            u for u in all_users
            if search_lower in u.to_dict().get("fullName", "").lower()
            or search_lower in u.to_dict().get("name", "").lower()
            or search_lower in u.to_dict().get("email", "").lower()
        ]

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_users.sort(key=get_created_at, reverse=True)
    total = len(all_users)
    paginated_users = all_users[skip : skip + limit]

    result = []
    for u_doc in paginated_users:
        u = u_doc.to_dict()
        result.append({
            "id": u_doc.id,
            "fullName": u.get("fullName", u.get("name", "")),
            "email": u.get("email", ""),
            "phone": u.get("phone", ""),
            "role": u.get("role", "customer"),
            "isShopkeeper": u.get("isShopkeeper", False),
            "shopkeeperStatus": u.get("shopkeeperStatus", "none"),
            "isBlocked": u.get("isBlocked", False),
            "isEmailVerified": u.get("isEmailVerified", False),
            "createdAt": u.get("createdAt"),
        })

    return {"success": True, "total": total, "users": result}


# ─── PUT /admin/users/{user_id}/block & unblock ───────────────────────────────

@router.put("/users/{user_id}/block")
async def block_user(user_id: str, current_user: dict = Depends(require_super_admin)):
    db = get_db()
    user_ref = db.collection("users").document(user_id)
    user_snap = user_ref.get()
    if not user_snap.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_snap.to_dict()
    if user.get("role") == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot block super admin")

    user_ref.update({"isBlocked": True, "updatedAt": datetime.now(timezone.utc)})
    return {"success": True, "message": "User blocked"}


@router.put("/users/{user_id}/unblock")
async def unblock_user(user_id: str, current_user: dict = Depends(require_super_admin)):
    db = get_db()
    user_ref = db.collection("users").document(user_id)
    user_snap = user_ref.get()
    if not user_snap.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.update({"isBlocked": False, "updatedAt": datetime.now(timezone.utc)})
    return {"success": True, "message": "User unblocked"}


# ─── GET /admin/support-tickets & GET /admin/tickets ──────────────────────────

@router.get("/support-tickets")
async def list_support_tickets(
    status: Optional[str] = None,
    role: Optional[str] = None,
    context: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    # Prefer context param over role param for filtering
    filter_context = context or role
    print(f"[DEBUG LOG] Admin Support API: context filter used: {filter_context}")
    coll_ref = db.collection("support_tickets")
    
    query_ref = coll_ref
    if status:
        query_ref = coll_ref.where("status", "==", status.lower())

    all_tickets = list(query_ref.stream())
    
    # Filter by supportContext in Python (Firestore compound queries limited)
    if filter_context:
        filtered = []
        for d in all_tickets:
            t = d.to_dict()
            sc = t.get("supportContext") or t.get("role", "customer")
            if sc == filter_context:
                filtered.append(d)
        all_tickets = filtered

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_tickets.sort(key=get_created_at, reverse=True)
    total = len(all_tickets)
    paginated_tickets = all_tickets[skip : skip + limit]

    # Pre-fetch user profiles to minimize reads
    user_ids = list(set([t.to_dict().get("userId") for t in paginated_tickets if t.to_dict().get("userId")]))
    users_map = {}
    for u_id in user_ids:
        u_snap = db.collection("users").document(u_id).get()
        if u_snap.exists:
            users_map[u_id] = u_snap.to_dict()

    result = []
    for t_doc in paginated_tickets:
        t = t_doc.to_dict()
        u_id = t.get("userId")
        user = users_map.get(u_id) if u_id else None

        sc = t.get("supportContext") or t.get("role", "customer")
        ticket_type = "SHOPKEEPER" if sc == "shopkeeper" else "CUSTOMER"

        u_name = user.get("fullName", user.get("name", "")) if user else t.get("userName", "")
        u_email = user.get("email", "") if user else ""
        profile_img = user.get("profileImage") if user else None

        initials = "".join([part[0].upper() for part in u_name.split() if part])[:2] or "U"

        user_data = {
            "name": u_name,
            "email": u_email,
            "avatarType": "image" if profile_img else "initials",
            "avatarUrl": profile_img or "",
            "bgColor": "bg-primary-container",
            "textColor": "text-primary",
            "initials": initials
        }

        created_at_val = t.get("createdAt")
        if isinstance(created_at_val, datetime):
            created_str = created_at_val.isoformat()
        else:
            created_str = str(created_at_val) if created_at_val else ""

        result.append({
            "id": t_doc.id,
            "ticketNumber": t.get("ticketNumber", f"TKT-{t_doc.id[:6].upper()}"),
            "user": user_data,
            "type": ticket_type,
            "role": t.get("role", "customer"),
            "supportContext": sc,
            "subject": t.get("subject", ""),
            "message": t.get("message", t.get("description", "")),
            "description": t.get("description", t.get("message", "")),
            "status": t.get("status", "open").upper(),
            "priority": t.get("priority", "low").upper(),
            "category": t.get("category", "general"),
            "createdAt": created_str,
        })

    res_data = {"success": True, "total": total, "tickets": result}
    print(f"[DEBUG LOG] Admin Support-Tickets API response: {res_data}")
    return res_data


@router.get("/tickets")
async def list_admin_tickets_direct(
    status: Optional[str] = None,
    role: Optional[str] = None,
    context: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    # Prefer context over role for filtering
    filter_context = context or role
    print(f"[DEBUG LOG] Admin Support API: context filter used: {filter_context}")
    coll_ref = db.collection("support_tickets")
    
    query_ref = coll_ref
    if status:
        query_ref = coll_ref.where("status", "==", status.lower())

    all_tickets = list(query_ref.stream())
    
    # Filter by supportContext in Python
    if filter_context:
        filtered = []
        for d in all_tickets:
            t = d.to_dict()
            sc = t.get("supportContext") or t.get("role", "customer")
            if sc == filter_context:
                filtered.append(d)
        all_tickets = filtered

    all_tickets.sort(key=lambda d: d.to_dict().get("createdAt") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    paginated_tickets = all_tickets[skip : skip + limit]

    # Pre-fetch user profiles to minimize reads
    user_ids = list(set([t.to_dict().get("userId") for t in paginated_tickets if t.to_dict().get("userId")]))
    users_map = {}
    for u_id in user_ids:
        u_snap = db.collection("users").document(u_id).get()
        if u_snap.exists:
            users_map[u_id] = u_snap.to_dict()

    result = []
    for t_doc in paginated_tickets:
        t = t_doc.to_dict()
        u_id = t.get("userId")
        user = users_map.get(u_id) if u_id else None

        sc = t.get("supportContext") or t.get("role", "customer")
        ticket_type = "SHOPKEEPER" if sc == "shopkeeper" else "CUSTOMER"

        u_name = user.get("fullName", user.get("name", "")) if user else t.get("userName", "")
        u_email = user.get("email", "") if user else ""
        profile_img = user.get("profileImage") if user else None

        initials = "".join([part[0].upper() for part in u_name.split() if part])[:2] or "U"

        user_data = {
            "name": u_name,
            "email": u_email,
            "avatarType": "image" if profile_img else "initials",
            "avatarUrl": profile_img or "",
            "bgColor": "bg-primary-container",
            "textColor": "text-primary",
            "initials": initials
        }

        created_at_val = t.get("createdAt")
        if isinstance(created_at_val, datetime):
            created_str = created_at_val.isoformat()
        else:
            created_str = str(created_at_val) if created_at_val else ""

        result.append({
            "id": t_doc.id,
            "ticketNumber": t.get("ticketNumber", f"TKT-{t_doc.id[:6].upper()}"),
            "user": user_data,
            "type": ticket_type,
            "role": t.get("role", "customer"),
            "supportContext": sc,
            "subject": t.get("subject", ""),
            "message": t.get("message", t.get("description", "")),
            "description": t.get("description", t.get("message", "")),
            "status": t.get("status", "open").upper(),
            "priority": t.get("priority", "low").upper(),
            "category": t.get("category", "general"),
            "createdAt": created_str,
        })

    print(f"[DEBUG LOG] Admin Support API: ticket count returned: {len(result)}")
    return result


# ─── GET /admin/system-health ──────────────────────────────────────────────────

@router.get("/system-health")
async def get_system_health(current_user: dict = Depends(require_super_admin)):
    return {
        "uptime": "99.99%",
        "latency": "24ms",
        "dbLoad": "15%",
        "incidents": []
    }


# ─── GET /admin/orders ────────────────────────────────────────────────────────

@router.get("/orders")
async def list_all_orders_admin(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(require_super_admin),
):
    db = get_db()
    orders_ref = db.collection("orders").stream()
    all_orders = list(orders_ref)

    if status:
        all_orders = [o for o in all_orders if o.to_dict().get("orderStatus") == status]

    def get_created_at(doc):
        val = doc.to_dict().get("createdAt")
        if val is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        return val

    all_orders.sort(key=get_created_at, reverse=True)
    total = len(all_orders)
    paginated_orders = all_orders[skip : skip + limit]

    result = []
    for doc in paginated_orders:
        o = doc.to_dict()
        items = o.get("items", [])
        
        # Parse pickup date and time from pickupTime or defaults
        pickup_time_str = o.get("pickupTime") or ""
        pickup_date = ""
        pickup_time = ""
        if pickup_time_str:
            parts = pickup_time_str.split(" ")
            if len(parts) >= 2:
                pickup_date = parts[0]
                pickup_time = " ".join(parts[1:])
            else:
                pickup_date = pickup_time_str
        
        result.append({
            "id": doc.id,
            "customer_name": o.get("customerName", "Customer"),
            "shop_name": o.get("shopName", "Shop"),
            "items_count": sum(item.get("quantity", 0) for item in items),
            "total": o.get("totalAmount", 0.0),
            "pickup_date": pickup_date,
            "pickup_time": pickup_time,
            "status": o.get("orderStatus", "placed"),
            "created_at": o.get("createdAt").isoformat() if isinstance(o.get("createdAt"), datetime) else str(o.get("createdAt")),
        })

    return {"success": True, "total": total, "orders": result}


# ─── GET /admin/reviews ──────────────────────────────────────────────────────

@router.get("/reviews")
async def admin_get_reviews(
    current_user: dict = Depends(require_super_admin)
):
    db = get_db()
    reviews_stream = db.collection("reviews").stream()
    
    reviews_list = []
    total_rating = 0.0
    flagged_count = 0
    removed_count = 0
    
    for doc in reviews_stream:
        r = doc.to_dict()
        status = r.get("status", "APPROVED").upper()
        rating = int(r.get("rating", 0))
        
        # Count stats
        if status == "FLAGGED":
            flagged_count += 1
        elif status == "REMOVED":
            removed_count += 1
            
        total_rating += rating
        
        created_at_val = r.get("createdAt") or r.get("updatedAt")
        if created_at_val:
            if isinstance(created_at_val, str):
                date_str = created_at_val
            else:
                date_str = created_at_val.isoformat()
        else:
            date_str = ""
            
        reviews_list.append({
            "id": doc.id,
            "userId": r.get("customerId") or r.get("userId", ""),
            "customerId": r.get("customerId") or r.get("userId", ""),
            "name": r.get("customerName") or r.get("userName") or "Anonymous",
            "userName": r.get("userName") or r.get("customerName") or "Anonymous",
            "shop": r.get("shopName") or "Unknown Shop",
            "shopName": r.get("shopName") or "Unknown Shop",
            "shopId": r.get("shopId", ""),
            "rating": rating,
            "content": r.get("comment") or r.get("review_text") or "",
            "comment": r.get("comment") or r.get("review_text") or "",
            "date": date_str,
            "createdAt": date_str,
            "status": status,
            "avatar": r.get("avatar") or "https://placehold.co/100x100?text=User"
        })
        
    total_reviews = len(reviews_list)
    avg_rating = round(total_rating / total_reviews, 1) if total_reviews > 0 else 0.0
    
    # Sort reviews by date/createdAt descending
    def get_sort_key(x):
        val = x.get("date")
        if not val:
            return ""
        return val
    reviews_list.sort(key=get_sort_key, reverse=True)
    
    return {
        "success": True,
        "reviews": reviews_list,
        "totalReviews": total_reviews,
        "averageRating": avg_rating,
        "flaggedReviews": flagged_count,
        "removedReviews": removed_count
    }


# ─── PUT /admin/reviews/{review_id}/status ───────────────────────────────────

@router.put("/reviews/{review_id}/status")
async def admin_update_review_status(
    review_id: str,
    body: dict,
    current_user: dict = Depends(require_super_admin)
):
    db = get_db()
    new_status = body.get("status", "APPROVED").upper()
    
    review_ref = db.collection("reviews").document(review_id)
    review_snap = review_ref.get()
    if not review_snap.exists:
        raise HTTPException(status_code=404, detail="Review not found")
        
    review_ref.update({
        "status": new_status,
        "updatedAt": datetime.now(timezone.utc)
    })
    
    # Recalculate average shop rating and ratingCount
    review_data = review_snap.to_dict()
    shop_id = review_data.get("shopId")
    if shop_id:
        all_reviews_stream = db.collection("reviews").where("shopId", "==", shop_id).stream()
        all_reviews = []
        for doc in all_reviews_stream:
            rd = doc.to_dict()
            if doc.id == review_id:
                rd["status"] = new_status
            if rd.get("status", "APPROVED").upper() != "REMOVED":
                all_reviews.append(rd)
                
        count_val = len(all_reviews)
        rating_val = 0.0
        if count_val > 0:
            rating_val = round(sum(float(r.get("rating", 0.0)) for r in all_reviews) / count_val, 1)
            
        db.collection("shops").document(shop_id).update({
            "rating": rating_val,
            "ratingCount": count_val
        })
        
    return {"success": True, "message": "Review status updated successfully"}
