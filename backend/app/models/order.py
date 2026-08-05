from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: Optional[str] = None


class OrderCreate(BaseModel):
    pickup_date: str
    pickup_time: str
    notes: Optional[str] = None
    shopId: str
    items: List[OrderItem]
    totalAmount: float
    orderType: str = "pickup"


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|rejected|preparing|ready|completed)$")


class OrderResponse(BaseModel):
    id: str
    user_id: str
    shop_id: str
    shop_name: str
    items: List[OrderItem]
    total: float
    status: str
    pickup_date: str
    pickup_time: str
    customer_name: str
    customer_phone: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
