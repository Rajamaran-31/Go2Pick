from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ShopkeeperRequestCreate(BaseModel):
    owner_name: str = Field(..., min_length=2)
    shop_name: str = Field(..., min_length=2)
    category: str
    phone: str = Field(..., min_length=10)
    email: str
    address: str
    shop_image: Optional[str] = None
    business_proof: Optional[str] = None
    description: Optional[str] = None
    opening_time: str = "09:00"
    closing_time: str = "21:00"


class ShopkeeperRequestResponse(BaseModel):
    id: str
    user_id: str
    owner_name: str
    shop_name: str
    category: str
    phone: str
    email: str
    address: str
    shop_image: Optional[str] = None
    business_proof: Optional[str] = None
    description: Optional[str] = None
    opening_time: str
    closing_time: str
    status: str = "pending"
    admin_notes: Optional[str] = None
    created_at: datetime
