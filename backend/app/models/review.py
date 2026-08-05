from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    shop_id: str
    product_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    review_text: str

class ReviewStatusUpdate(BaseModel):
    status: str
