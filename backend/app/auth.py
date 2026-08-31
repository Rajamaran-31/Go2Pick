from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

from app.config import get_settings
from app.database import get_db

import jwt
from datetime import timedelta

security_scheme = HTTPBearer(auto_error=False)


# ─── Password Hashing Shims (for seed compatibility) ──────────────────────────

def hash_password(password: str) -> str:
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    import bcrypt
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
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
    
    # 1. Try custom JWT decode first, then Firebase ID Token fallback
    payload = decode_token(token)
    if payload and "sub" in payload:
        uid = payload["sub"]
        decoded_token = {
            "uid": uid,
            "email": payload.get("email", ""),
            "role": payload.get("role", "customer"),
        }
    else:
        try:
            if firebase_admin._apps:
                decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
                uid = decoded_token.get("uid")
            else:
                raise ValueError("Firebase SDK not initialized")
        except Exception as fb_err:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Fetch user profile from Firestore
    user = None
    try:
        user_ref = db.collection("users").document(uid)
        user_snap = user_ref.get()
        if user_snap.exists:
            user = user_snap.to_dict()
            user["_id"] = uid
            user["id"] = uid
    except Exception as fe:
        print(f"[WARN] get_current_user Firestore fetch failed: {fe}")

    if not user:
        email_val = decoded_token.get("email", "")
        role_val = decoded_token.get("role") or ("super_admin" if email_val.lower() == get_settings().ADMIN_EMAIL.lower() else "customer")
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

    # Expose both _id and id for backwards compatibility in other modules
    user["_id"] = uid
    user["id"] = uid
    return user


async def require_customer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ("customer", "shopkeeper", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )
    return current_user


async def require_shopkeeper(current_user: dict = Depends(get_current_user)) -> dict:
    is_sk = current_user.get("role") == "shopkeeper" or current_user.get("isShopkeeper", False)
    db = get_db()
    user_id = str(current_user["_id"])
    
    if not is_sk:
        shops_ref = db.collection("shops").where("ownerId", "==", user_id).stream()
        shops = list(shops_ref)
        if shops:
            is_sk = True
            db.collection("users").document(user_id).update({
                "isShopkeeper": True,
                "shopkeeperStatus": "approved",
                "shopkeeperDashboardEnabled": True,
                "activeShopId": shops[0].id,
                "shop_id": shops[0].id,
                "updatedAt": datetime.now(timezone.utc)
            })
            current_user["isShopkeeper"] = True
            current_user["shopkeeperStatus"] = "approved"
            current_user["shopkeeperDashboardEnabled"] = True
            current_user["activeShopId"] = shops[0].id
            current_user["shop_id"] = shops[0].id

    if not is_sk and current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shopkeeper access required"
        )

    if ("shop_id" in current_user or "activeShopId" in current_user) and "activeShopId" not in current_user:
        current_user["activeShopId"] = str(current_user.get("shop_id", current_user.get("activeShopId")))

    if current_user.get("role") != "super_admin" and not current_user.get("shopkeeperDashboardEnabled", False):
        if current_user.get("shopkeeperStatus") == "approved":
            db.collection("users").document(user_id).update({
                "shopkeeperDashboardEnabled": True,
                "updatedAt": datetime.now(timezone.utc)
            })
            current_user["shopkeeperDashboardEnabled"] = True
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shopkeeper dashboard not enabled. Enable it from the notification first."
            )
    return current_user


async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user
