from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ShopCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    category: str
    address: str
    image: Optional[str] = None
    description: Optional[str] = None
    opening_time: str = "09:00"
    closing_time: str = "21:00"
    phone: Optional[str] = None
    email: Optional[str] = None


class ShopUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class ShopResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    category: str
    address: str
    image: Optional[str] = None
    description: Optional[str] = None
    opening_time: str
    closing_time: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    rating: float = 0.0
    total_orders: int = 0
    created_at: datetime
