from pydantic import BaseModel, Field
from typing import Optional


class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    shop_id: str
    product_name: str
    product_image: Optional[str] = None
    product_price: float
    shop_name: str
    quantity: int
    subtotal: float
