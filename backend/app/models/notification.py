from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Notification(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool = False
    show_get_access_button: bool = False
    created_at: datetime
