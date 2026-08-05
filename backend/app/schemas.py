from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
import re


# ─── Common helpers ──────────────────────────────────────────────────────────

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        return str(v)


# ─── Auth / User ─────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=15)
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str


class ResendOtpRequest(BaseModel):
    email: EmailStr
    type: str = "signup"  # signup | forgot_password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    newPassword: str = Field(..., min_length=8)

    @field_validator("newPassword")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseModel):
    id: str
    fullName: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    isEmailVerified: bool = False
    isShopkeeper: bool = False
    shopkeeperStatus: str = "none"
    shopkeeperDashboardEnabled: bool = False
    activeShopId: Optional[str] = None
    currentMode: str = "customer"
    profileImage: Optional[str] = None
    isBlocked: bool = False
    createdAt: Optional[datetime] = None
    permissions: List[str] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class FirebaseLoginRequest(BaseModel):
    idToken: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


# ─── Shopkeeper Application ───────────────────────────────────────────────────

class ShopkeeperApplicationRequest(BaseModel):
    shopName: str = Field(..., min_length=2, max_length=100)
    ownerName: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=15)
    email: EmailStr
    address: str = Field(..., min_length=5)
    city: str
    pincode: str
    category: str
    description: Optional[str] = None
    businessProof: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    userId: str
    shopName: str
    ownerName: str
    phone: str
    email: str
    address: str
    city: str
    pincode: str
    category: str
    businessProof: Optional[str] = None
    description: Optional[str] = None
    status: str
    rejectionReason: Optional[str] = None
    submittedAt: Optional[datetime] = None
    reviewedAt: Optional[datetime] = None


# ─── Shop ────────────────────────────────────────────────────────────────────

class ShopResponse(BaseModel):
    id: str
    shopName: str
    category: str
    address: str
    phone: Optional[str] = None
    image: Optional[str] = None
    isActive: bool = True
    isApproved: bool = True
    rating: float = 0.0
    totalOrders: int = 0
    createdAt: Optional[datetime] = None


# ─── Product ─────────────────────────────────────────────────────────────────

class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: str
    price: float = Field(..., gt=0)
    stock: int = Field(0, ge=0)
    images: Optional[List[str]] = []
    isAvailable: bool = True
    unit: Optional[str] = "pc"


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    isAvailable: Optional[bool] = None
    unit: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    shopId: str
    shopName: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    stock: int
    images: List[str] = []
    isAvailable: bool = True
    createdAt: Optional[datetime] = None
    unit: str = "pc"


# ─── Cart ─────────────────────────────────────────────────────────────────────

class AddToCartRequest(BaseModel):
    productId: str
    quantity: int = Field(1, ge=1)


class CartItemResponse(BaseModel):
    id: str
    productId: str
    productName: str
    productPrice: float
    productImage: Optional[str] = None
    shopId: str
    shopName: str
    quantity: int
    subtotal: float
    productUnit: Optional[str] = "pc"
    product_unit: Optional[str] = "pc"


# ─── Order ────────────────────────────────────────────────────────────────────

class OrderItemSchema(BaseModel):
    productId: str
    name: str
    price: float
    quantity: int
    image: Optional[str] = None
    unit: Optional[str] = "pc"
    productUnit: Optional[str] = "pc"
    product_unit: Optional[str] = "pc"


class CreateOrderRequest(BaseModel):
    orderType: str = "pickup"  # pickup | delivery
    pickupTime: Optional[str] = None
    deliveryAddress: Optional[str] = None
    notes: Optional[str] = None


class OrderStatusUpdateRequest(BaseModel):
    status: str
    cancellationReason: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    customerId: str
    shopId: str
    shopName: Optional[str] = None
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None
    items: List[OrderItemSchema] = []
    totalAmount: float
    orderType: str = "pickup"
    pickupTime: Optional[str] = None
    deliveryAddress: Optional[str] = None
    paymentStatus: str = "pending"
    orderStatus: str
    pickupCode: Optional[str] = None
    cancellationReason: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


# ─── Review ───────────────────────────────────────────────────────────────────

class ReviewCreateRequest(BaseModel):
    orderId: Optional[str] = None
    shopId: str
    userId: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    customerId: str
    shopId: str
    orderId: Optional[str] = None
    customerName: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    createdAt: Optional[datetime] = None


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    userId: str
    title: str
    message: str
    type: Optional[str] = None
    actionLabel: Optional[str] = None
    actionType: Optional[str] = None
    isRead: bool = False
    createdAt: Optional[datetime] = None


# ─── Admin ────────────────────────────────────────────────────────────────────

class RejectApplicationRequest(BaseModel):
    rejectionReason: str = Field(..., min_length=5)


class ShopSettingsUpdateRequest(BaseModel):
    shopName: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    businessPhone: Optional[str] = None
    businessEmail: Optional[str] = None
    image: Optional[str] = None
    imageUrl: Optional[str] = None
    coverImageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    whatsapp: Optional[str] = None
    businessHours: Optional[dict] = None


class PlatformSettingsUpdateRequest(BaseModel):
    commissionPercentage: Optional[float] = None
    flatProcessingFee: Optional[float] = None
    merchantPayoutDelay: Optional[str] = None
    maintenanceMode: Optional[bool] = None
