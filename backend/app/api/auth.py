from app.utils.object_id import to_object_id
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        phone=user["phone"],
        role=user.get("role", "customer"),
        avatar=user.get("avatar"),
        is_blocked=user.get("is_blocked", False),
        is_shopkeeper_approved=user.get("is_shopkeeper_approved", False),
        shop_id=str(user["shop_id"]) if user.get("shop_id") else None,
        created_at=user.get("created_at", datetime.now(timezone.utc)),
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    db = get_db()

    existing = await db["users"].find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    user_doc = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "phone": user_data.phone,
        "role": "customer",
        "avatar": None,
        "is_blocked": False,
        "is_shopkeeper_approved": False,
        "shop_id": None,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db["users"].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id), "role": "customer"})

    return TokenResponse(
        access_token=token,
        user=user_to_response(user_doc),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()

    user = await db["users"].find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.get("is_blocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Contact support.",
        )

    token = create_access_token({"sub": str(user["_id"]), "role": user.get("role", "customer")})

    return TokenResponse(
        access_token=token,
        user=user_to_response(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_to_response(
        {**current_user, "_id": to_object_id(current_user["_id"]) if isinstance(current_user["_id"], str) else current_user["_id"]}
    )


@router.put("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db["users"].update_one(
        {"_id": to_object_id(current_user["_id"])},
        {"$set": update_dict},
    )

    updated_user = await db["users"].find_one({"_id": to_object_id(current_user["_id"])})
    return user_to_response(updated_user)
