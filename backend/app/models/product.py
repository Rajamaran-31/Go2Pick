from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    shop_id: str
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    image: Optional[str] = None
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    category: Optional[str] = None
    unit: str = "piece"
    is_available: bool = True
    low_stock_threshold: int = Field(default=5, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    is_available: Optional[bool] = None
    low_stock_threshold: Optional[int] = None


class ProductResponse(BaseModel):
    id: str
    shop_id: str
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    price: float
    stock: int
    category: Optional[str] = None
    unit: str = "piece"
    is_available: bool = True
    low_stock_threshold: int = 5
    shop_name: Optional[str] = None
    created_at: datetime
