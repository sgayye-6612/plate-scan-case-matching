from pydantic import BaseModel
from datetime import datetime


class ScanCreate(BaseModel):
    camera_id: str
    plate: str
    vin: str
    latitude: float
    longitude: float
    scanned_at: datetime
    image_url: str | None = None