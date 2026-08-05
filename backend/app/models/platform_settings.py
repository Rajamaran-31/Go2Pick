from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PlatformSettingsUpdate(BaseModel):
    commission_percentage: Optional[float] = None
    flat_processing_fee: Optional[float] = None
    merchant_payout_delay: Optional[str] = None
