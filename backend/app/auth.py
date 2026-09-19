from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth

from app.config import get_settings
from app.database import get_db

import jwt
from datetime import timedelta

security_scheme = HTTPBearer(auto_error=False)


import hashlib
import hmac
import os

def hash_password(password: str) -> str:
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return f"pbkdf2:sha256:100000${salt.hex()}${key.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed or not plain:
        return False
    try:
        import bcrypt
        if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        pass

    if hashed.startswith("pbkdf2:sha256:"):
        try:
            parts = hashed.split("$")
            if len(parts) == 3:
                _, salt_hex, key_hex = parts
                salt = bytes.fromhex(salt_hex)
                expected_key = bytes.fromhex(key_hex)
                actual_key = hashlib.pbkdf2_hmac('sha256', plain.encode('utf-8'), salt, 100000)
                return hmac.compare_digest(actual_key, expected_key)
        except Exception:
            return False
    return False



# ─── JWT Token Helpers ────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        except Exception:
            return None


# ─── Security Dependencies ───────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    db = get_db()
    settings = get_settings()
    
    # 1. Try custom JWT decode first, then Firebase ID Token fallback
    payload = decode_token(token)
    email_val = ""
    uid = None
    decoded_token = {}

    if payload and "sub" in payload:
        uid = payload["sub"]
        email_val = (payload.get("email") or "").lower()
        role_val = payload.get("role")
        if not role_val:
            role_val = "super_admin" if email_val == settings.ADMIN_EMAIL.lower() else "customer"
        decoded_token = {
            "uid": uid,
            "email": email_val,
            "role": role_val,
        }
    else:
        try:
            if getattr(firebase_admin, "_apps", None):
                decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
                uid = decoded_token.get("uid")
                email_val = (decoded_token.get("email") or "").lower()
            else:
                # If Firebase Admin SDK isn't active, fallback to JWT unverified payload
                if payload:
                    uid = payload.get("sub", payload.get("user_id", "user-default"))
                    email_val = (payload.get("email") or "").lower()
                    decoded_token = payload
                else:
                    raise ValueError("Firebase SDK not initialized")
        except Exception as fb_err:
            print(f"[WARN] verify_id_token error: {fb_err}")
            # Try to decode without verification for dev resilience
            if payload:
                uid = payload.get("sub", payload.get("user_id", "user-default"))
                email_val = (payload.get("email") or "").lower()
                decoded_token = payload
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Authentication failed: {str(fb_err)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # Fetch user profile from MongoDB Atlas
    user = None
    mongo_db = getattr(db, "mongo_db", None)

    if mongo_db is not None:
        try:
            query = [{"_id": uid}, {"id": uid}]
            if email_val:
                query.append({"email": email_val})
            m_user = mongo_db["users"].find_one({"$or": query})
            if m_user:
                m_user["_id"] = str(m_user.get("_id", uid))
                m_user["id"] = m_user["_id"]
                user = m_user
        except Exception as me:
            print(f"[WARN] get_current_user Mongo fetch error: {me}")

    if not user:
        try:
            user_ref = db.collection("users").document(uid)
            user_snap = user_ref.get()
            if user_snap.exists:
                user = user_snap.to_dict()
                user["_id"] = uid
                user["id"] = uid
        except Exception:
            pass

    if not user:
        role_val = decoded_token.get("role") or ("super_admin" if email_val.lower() == settings.ADMIN_EMAIL.lower() else "customer")
        user = {
            "_id": uid,
            "id": uid,
            "fullName": decoded_token.get("name") or (email_val.split("@")[0].capitalize() if email_val else "User"),
            "email": email_val,
            "phone": decoded_token.get("phone_number", ""),
            "role": role_val,
            "isEmailVerified": True,
            "isShopkeeper": True if role_val == "shopkeeper" else False,
            "shopkeeperStatus": "approved" if role_val == "shopkeeper" else "none",
            "shopkeeperDashboardEnabled": True if role_val == "shopkeeper" else False,
            "activeShopId": None,
            "currentMode": role_val,
            "profileImage": decoded_token.get("picture"),
            "isBlocked": False,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }

    if user.get("isBlocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Contact support."
        )

    admin_email = settings.ADMIN_EMAIL.lower()
    user_email_lower = user.get("email", "").lower()
    if user_email_lower in [admin_email, "admin@go2pick.com"]:
        user["role"] = "super_admin"
    if user_email_lower in [admin_email, "admin@go2pick.com", "rajamaran32@gmail.com"]:
        user["isSuperAdmin"] = True

    # Ensure approved shopkeepers have shopkeeper context
    if user.get("shopkeeperStatus") == "approved":
        if user.get("role") != "super_admin":
            user["role"] = "shopkeeper"
        user["isShopkeeper"] = True
        user["shopkeeperStatus"] = "approved"
        user["shopkeeperDashboardEnabled"] = True
        if not user.get("activeShopId"):
            user["activeShopId"] = "shop-grany-groceries"
            user["shop_id"] = "shop-grany-groceries"

    # Expose both _id and id for backwards compatibility in other modules
    user["_id"] = uid
    user["id"] = uid
    return user


async def require_customer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("isBlocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Contact support."
        )
    return current_user


async def require_shopkeeper(current_user: dict = Depends(get_current_user)) -> dict:
    email = (current_user.get("email") or "").lower()
    if current_user.get("role") == "super_admin":
        current_user["isShopkeeper"] = True
        current_user["shopkeeperStatus"] = "approved"
        current_user["shopkeeperDashboardEnabled"] = True
        if not current_user.get("activeShopId"):
            current_user["activeShopId"] = "shop-grany-groceries"
            current_user["shop_id"] = "shop-grany-groceries"
        return current_user

    is_sk = current_user.get("role") == "shopkeeper" or current_user.get("isShopkeeper", False) or current_user.get("shopkeeperStatus") == "approved"
    db = get_db()
    user_id = str(current_user["_id"])

    if not is_sk:
        try:
            shops = list(db.collection("shops").where("ownerId", "==", user_id).stream())
            if not shops and email:
                shops = list(db.collection("shops").where("email", "==", email).stream())
            if shops:
                is_sk = True
                current_user["isShopkeeper"] = True
                current_user["shopkeeperStatus"] = "approved"
                current_user["shopkeeperDashboardEnabled"] = True
                current_user["activeShopId"] = shops[0].id
                current_user["shop_id"] = shops[0].id
        except Exception as se:
            print(f"[WARN] Error checking shops in require_shopkeeper: {se}")

    if not is_sk and email:
        try:
            apps = list(db.collection("shopkeeper_applications").where("email", "==", email).stream())
            for a in apps:
                if a.to_dict().get("status") == "approved":
                    is_sk = True
                    current_user["isShopkeeper"] = True
                    current_user["shopkeeperStatus"] = "approved"
                    current_user["shopkeeperDashboardEnabled"] = True
                    break
        except Exception as ae:
            print(f"[WARN] Error checking applications in require_shopkeeper: {ae}")

    if not is_sk:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shopkeeper access required"
        )

    current_user["shopkeeperDashboardEnabled"] = True
    return current_user


async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    role = (current_user.get("role") or "").lower()
    email = (current_user.get("email") or "").lower()
    admin_email = get_settings().ADMIN_EMAIL.lower()
    super_admin_emails = {admin_email, "admin@go2pick.com", "rajamaran32@gmail.com"}
    is_admin = (
        role in ["super_admin", "admin"] or
        email in super_admin_emails or
        current_user.get("isSuperAdmin") is True
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user
