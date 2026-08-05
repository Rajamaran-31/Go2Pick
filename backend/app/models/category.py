from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    image: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    image: Optional[str] = None
    description: Optional[str] = None
    shop_count: int = 0
