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


class LoginRequest(BaseModel):
    username: str
    password: str


class ClaimResponse(BaseModel):
    message: str
    case_id: int
    status: str
    tenant_id: int
    claimed_by: int