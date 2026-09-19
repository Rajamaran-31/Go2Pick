from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional, List
from datetime import datetime, timezone
import requests
from firebase_admin import auth

from app.database import get_db
from app.config import get_settings
from app.auth import get_current_user, create_access_token, hash_password, verify_password
from app.utils import to_object_id, resolve_static_url
from app.validators import is_valid_email, is_strong_password
from app.schemas import (
    SignupRequest, VerifyEmailRequest, ResendOtpRequest,
    LoginRequest, ForgotPasswordRequest, VerifyForgotOtpRequest, ResetPasswordRequest,
    UserResponse, TokenResponse, UpdateProfileRequest,
    FirebaseLoginRequest
)
from pydantic import BaseModel
from app.services.otp_service import create_otp, verify_otp
from app.services.email_service import send_signup_otp, send_forgot_password_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_to_response(user: dict) -> UserResponse:
    user_id = str(user.get("_id", user.get("id", "")))
    email_val = (user.get("email") or "").lower()
    role = user.get("role", "customer")
    is_sk = user.get("isShopkeeper", False)
    sk_status = user.get("shopkeeperStatus", "none")
    dash_enabled = user.get("shopkeeperDashboardEnabled", False)
    active_shop = str(user["activeShopId"]) if user.get("activeShopId") else (str(user["shop_id"]) if user.get("shop_id") else None)

    if sk_status == "approved" or role == "shopkeeper" or is_sk:
        if role != "super_admin":
            role = "shopkeeper"
        is_sk = True
        sk_status = "approved"
        dash_enabled = True
        if not active_shop:
            active_shop = "shop-grany-groceries"

    permissions = []
    if role == "super_admin":
        permissions = ["all"]
    elif is_sk:
        permissions = ["manage_shop", "manage_products", "manage_orders"]
    else:
        permissions = ["browse", "checkout"]

    prof_img = user.get("profileImage") or user.get("avatar")

    return UserResponse(
        id=user_id,
        fullName=user.get("fullName") or user.get("name") or "",
        email=user.get("email"),
        phone=user.get("phone"),
        role=role,
        isEmailVerified=user.get("isEmailVerified", False),
        isShopkeeper=is_sk,
        shopkeeperStatus=sk_status,
        shopkeeperDashboardEnabled=dash_enabled,
        activeShopId=active_shop,
        currentMode=user.get("currentMode", "customer"),
        profileImage=resolve_static_url(prof_img),
        isBlocked=user.get("isBlocked", False),
        createdAt=user.get("createdAt"),
        permissions=permissions,
    )


# ─── POST /auth/signup ────────────────────────────────────────────────────────

@router.post("/signup", status_code=201)
async def signup(body: SignupRequest):
    db = get_db()

    # Backend validations
    if not is_valid_email(body.email):
         raise HTTPException(status_code=400, detail="Invalid email format")
    
    if not is_strong_password(body.password):
         raise HTTPException(status_code=400, detail="Password is too weak. It must be at least 8 characters long and contain an uppercase letter and a number.")

    # Check if user already exists in MongoDB
    existing_snap = list(db.collection("users").where("email", "==", body.email.lower()).limit(1).stream())
    if existing_snap:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    import uuid
    uid = f"user-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password(body.password)

    user_doc = {
        "id": uid,
        "fullName": body.fullName,
        "email": body.email.lower(),
        "phone": body.phone,
        "passwordHash": hashed_pwd,
        "role": "customer",
        "isEmailVerified": False,
        "isShopkeeper": False,
        "shopkeeperStatus": "none",
        "rejectionReason": None,
        "shopkeeperDashboardEnabled": False,
        "activeShopId": None,
        "currentMode": "customer",
        "profileImage": None,
        "isBlocked": False,
        "createdAt": now,
        "updatedAt": now,
    }

    db.collection("users").document(uid).set(user_doc)

    # Generate and send OTP
    otp = await create_otp(body.email, "signup")
    send_signup_otp(body.email, body.fullName, otp)

    return {
        "success": True,
        "message": "Account created. Check your email for the OTP to verify your account.",
        "userId": uid,
    }



# ─── POST /auth/verify-email ──────────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest):
    db = get_db()

    docs = list(db.collection("users").where("email", "==", body.email.lower()).limit(1).stream())
    if not docs:
        raise HTTPException(status_code=404, detail="User not found")
    user_doc_ref = docs[0].reference
    user = docs[0].to_dict()
    uid = docs[0].id
    user["_id"] = uid

    if user.get("isEmailVerified"):
        # If already verified, return a valid token anyway for seamless UX
        token = create_access_token({"sub": uid, "role": user.get("role", "customer"), "email": user["email"]})
        return {
            "success": True,
            "message": "Email already verified",
            "access_token": token,
            "token_type": "bearer",
            "user": _user_to_response(user).model_dump(),
        }

    await verify_otp(body.email, body.otp, "signup")

    # Update Firestore user
    now = datetime.now(timezone.utc)
    user_doc_ref.update({
        "isEmailVerified": True,
        "updatedAt": now
    })
    user["isEmailVerified"] = True
    user["updatedAt"] = now

    # Update Firebase Auth email verified status
    try:
        auth.update_user(uid, email_verified=True)
    except Exception:
        pass

    # Generate custom access token (legacy JWT fallback)
    token = create_access_token({"sub": uid, "role": user.get("role", "customer"), "email": user["email"]})

    return {
        "success": True,
        "message": "Email verified successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": _user_to_response(user).model_dump(),
    }


# ─── POST /auth/resend-otp ────────────────────────────────────────────────────

@router.post("/resend-otp")
async def resend_otp(body: ResendOtpRequest):
    db = get_db()

    docs = list(db.collection("users").where("email", "==", body.email.lower()).limit(1).stream())
    if not docs:
        raise HTTPException(status_code=404, detail="User not found")
    user = docs[0].to_dict()

    otp = await create_otp(body.email, body.type)

    if body.type == "signup":
        send_signup_otp(body.email, user.get("fullName", "User"), otp)
    else:
        send_forgot_password_otp(body.email, otp)

    return {"success": True, "message": "OTP sent successfully"}


# ─── POST /auth/login ─────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    settings = get_settings()
    email_lower = body.email.lower()

    # Find user in MongoDB users collection
    user_docs = list(db.collection("users").where("email", "==", email_lower).limit(1).stream())
    
    if not user_docs:
        # Check if default admin account
        if email_lower == settings.ADMIN_EMAIL.lower() and body.password == settings.ADMIN_PASSWORD:
            uid = "admin-super-001"
            role = "super_admin"
            user_data = {
                "_id": uid,
                "id": uid,
                "fullName": "Super Admin",
                "email": email_lower,
                "role": role,
                "isEmailVerified": True,
                "isShopkeeper": True,
                "shopkeeperStatus": "approved",
                "shopkeeperDashboardEnabled": True,
                "activeShopId": "shop-grany-groceries",
                "currentMode": "super_admin",
            }
            token = create_access_token({"sub": uid, "role": role, "email": email_lower})
            return TokenResponse(access_token=token, user=_user_to_response(user_data))
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    user_snap = user_docs[0]
    user_dict = user_snap.to_dict()
    uid = user_snap.id

    if user_dict.get("isBlocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked. Contact support.")

    # Password check
    stored_hash = user_dict.get("passwordHash")
    if stored_hash:
        if not verify_password(body.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    else:
        # Fallback check for seed / demo / legacy users
        if body.password in ("Admin@123", "Shop@123", "Test@123") or len(body.password) >= 6:
            new_hash = hash_password(body.password)
            db.collection("users").document(uid).update({"passwordHash": new_hash})
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    id_token = create_access_token({
        "sub": uid,
        "email": email_lower,
        "role": user_dict.get("role", "customer")
    })
    
    return TokenResponse(access_token=id_token, user=_user_to_response(user_dict))



# ─── POST /auth/firebase-login ────────────────────────────────────────────────

@router.post("/firebase-login", response_model=TokenResponse)
async def firebase_login(body: FirebaseLoginRequest):
    db = get_db()
    try:
        decoded_token = auth.verify_id_token(body.idToken, clock_skew_seconds=60)
        uid = decoded_token.get("uid")
        if not uid:
             raise HTTPException(status_code=401, detail="Invalid Firebase ID token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Firebase verification failed: {str(e)}")

    user_ref = db.collection("users").document(uid)
    user_snap = user_ref.get()
    
    if not user_snap.exists:
        now = datetime.now(timezone.utc)
        email_val = decoded_token.get("email", "")
        email_val_lower = email_val.lower() if email_val else ""
        
        name_val = decoded_token.get("name")
        if not name_val:
            if email_val:
                name_val = email_val.split("@")[0]
            else:
                name_val = "New User"

        user_doc = {
            "fullName": name_val,
            "email": email_val_lower,
            "phone": decoded_token.get("phone_number", ""),
            "role": "customer",
            "isEmailVerified": decoded_token.get("email_verified", True),
            "isShopkeeper": False,
            "shopkeeperStatus": "none",
            "rejectionReason": None,
            "shopkeeperDashboardEnabled": False,
            "activeShopId": None,
            "currentMode": "customer",
            "profileImage": decoded_token.get("picture"),
            "isBlocked": False,
            "createdAt": now,
            "updatedAt": now,
        }
        settings = get_settings()
        if user_doc["email"] and user_doc["email"] == settings.ADMIN_EMAIL.lower():
             user_doc["role"] = "super_admin"
        user_ref.set(user_doc)
        user = user_doc
        user["_id"] = uid
    else:
        user = user_snap.to_dict()
        user["_id"] = uid

    if user.get("isBlocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked. Contact support.")

    return TokenResponse(access_token=body.idToken, user=_user_to_response(user))


# ─── POST /auth/forgot-password ───────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    db = get_db()
    docs = list(db.collection("users").where("email", "==", body.email.lower()).limit(1).stream())
    user = docs[0].to_dict() if docs else None

    # Always return success to prevent email enumeration, but only generate and send OTP if user exists
    if user:
        otp = await create_otp(body.email, "forgot_password")
        send_forgot_password_otp(body.email, otp)

    return {"success": True, "message": "If that email exists, an OTP has been sent."}


# ─── POST /auth/verify-forgot-otp ─────────────────────────────────────────────

@router.post("/verify-forgot-otp")
async def verify_forgot_otp_endpoint(body: VerifyForgotOtpRequest):
    await verify_otp(body.email, body.otp, "forgot_password", consume=False)
    return {"success": True, "message": "Verification code is valid."}


# ─── POST /auth/reset-password ────────────────────────────────────────────────

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    db = get_db()
    email_lower = body.email.lower()

    docs = list(db.collection("users").where("email", "==", email_lower).limit(1).stream())
    if not docs:
        raise HTTPException(status_code=404, detail="User not found")
    uid = docs[0].id

    await verify_otp(body.email, body.otp, "forgot_password", consume=True)

    new_hash = hash_password(body.newPassword)
    now = datetime.now(timezone.utc)
    db.collection("users").document(uid).update({
        "passwordHash": new_hash,
        "updatedAt": now
    })

    return {"success": True, "message": "Password reset successfully. You can now log in."}




# ─── GET /auth/me ─────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_to_response(current_user)


# ─── PUT /auth/profile ────────────────────────────────────────────────────────

@router.put("/profile")
async def update_profile(body: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["_id"]
    
    update_data = {}
    name_val = body.fullName or body.name
    if name_val is not None:
        update_data["fullName"] = name_val
        update_data["name"] = name_val
    if body.phone is not None:
        update_data["phone"] = body.phone
    if body.avatar is not None:
        update_data["profileImage"] = body.avatar
        update_data["avatar"] = body.avatar
        
    if update_data:
        update_data["updatedAt"] = datetime.now(timezone.utc)
        db.collection("users").document(user_id).update(update_data)
        
    updated_snap = db.collection("users").document(user_id).get()
    updated = updated_snap.to_dict()
    updated["_id"] = user_id
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user": _user_to_response(updated).model_dump()
    }


class SwitchModeRequest(BaseModel):
    mode: Optional[str] = None
    activeMode: Optional[str] = None

@router.post("/switch-mode")
async def switch_mode(body: SwitchModeRequest, current_user: dict = Depends(get_current_user)):
    """Switch between customer and shopkeeper mode."""
    new_mode = (body.mode or body.activeMode or "").strip().lower()
    if new_mode not in ["customer", "shopkeeper"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'customer' or 'shopkeeper'.")

    db = get_db()
    user_id = str(current_user["_id"])
    email_lower = (current_user.get("email") or "").lower()
    print(f"DEBUG [Switch Mode] user_id: {user_id}, email: {email_lower}")

    if new_mode == "shopkeeper":
        is_allowed = False
        active_shop_id = current_user.get("activeShopId") or current_user.get("shop_id")

        # Check 1: User doc flags
        if (
            current_user.get("isShopkeeper") is True or
            current_user.get("shopkeeperStatus") == "approved" or
            current_user.get("role") == "shopkeeper"
        ):
            is_allowed = True

        # Check 2: Shops collection by ownerId or email
        if not active_shop_id or not is_allowed:
            shops_by_owner = list(db.collection("shops").where("ownerId", "==", user_id).stream())
            shops_by_email = list(db.collection("shops").where("email", "==", email_lower).stream()) if email_lower else []
            combined_shops = shops_by_owner + shops_by_email
            for s in combined_shops:
                s_dict = s.to_dict()
                if s_dict.get("isApproved", True) is True and s_dict.get("isActive", True) is True:
                    is_allowed = True
                    active_shop_id = s.id
                    break

        # Check 3: Check approved applications for assigned shopId
        if not active_shop_id:
            apps = list(db.collection("shopkeeper_applications").where("userId", "==", user_id).stream())
            if not apps and email_lower:
                apps = list(db.collection("shopkeeper_applications").where("email", "==", email_lower).stream())
            for a in apps:
                a_data = a.to_dict()
                if a_data.get("status") == "approved":
                    is_allowed = True
                    if a_data.get("shopId"):
                        active_shop_id = a_data.get("shopId")
                        break

        if not is_allowed:
            raise HTTPException(
                status_code=403,
                detail="Your shopkeeper access is not approved yet.",
            )

        # Auto-update user document in DB to permanently grant shopkeeper access
        sk_update = {
            "isShopkeeper": True,
            "shopkeeperStatus": "approved",
            "shopkeeperDashboardEnabled": True,
            "activeMode": "shopkeeper",
            "currentMode": "shopkeeper",
            "updatedAt": datetime.now(timezone.utc)
        }
        if active_shop_id:
            sk_update["activeShopId"] = active_shop_id
            sk_update["shop_id"] = active_shop_id
        if current_user.get("role") != "super_admin":
            sk_update["role"] = "shopkeeper"

        try:
            db.collection("users").document(user_id).update(sk_update)
        except Exception as e:
            print(f"[WARN] Failed updating user doc in switch_mode: {e}")

    mode_update = {
        "currentMode": new_mode,
        "activeMode": new_mode,
        "updatedAt": datetime.now(timezone.utc)
    }

    try:
        db.collection("users").document(user_id).update(mode_update)
    except Exception:
        pass

    firestore_db = getattr(db, "firestore_db", None)
    mongo_db = getattr(db, "mongo_db", None)

    if mongo_db is not None:
        try:
            mongo_db["users"].update_many(
                {"$or": [{"_id": user_id}, {"id": user_id}, {"email": email_lower}]},
                {"$set": {**mode_update, "updatedAt": datetime.now(timezone.utc).isoformat()}}
            )
        except Exception:
            pass

    if firestore_db is not None:
        try:
            firestore_db.collection("users").document(user_id).update(mode_update)
        except Exception:
            pass

    user_snap = db.collection("users").document(user_id).get()
    updated_user = user_snap.to_dict() if user_snap.exists else current_user

    return {
        "success": True,
        "currentMode": new_mode,
        "activeMode": new_mode,
        "message": f"Switched to {new_mode} mode",
        "user": updated_user
    }
