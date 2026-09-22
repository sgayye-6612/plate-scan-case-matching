from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Camera, Scan, Case
from .schemas import ScanCreate

router = APIRouter(prefix="/api/v1")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/scans")
def create_scan(scan: ScanCreate, db: Session = Depends(get_db)):

    # Find camera and its tenant
    camera = (
        db.query(Camera)
        .filter(Camera.camera_id == scan.camera_id)
        .first()
    )

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    # Store every scan
    new_scan = Scan(
        camera_id=camera.id,
        plate=scan.plate,
        vin=scan.vin,
        latitude=scan.latitude,
        longitude=scan.longitude,
        scanned_at=scan.scanned_at,
        image_url=scan.image_url
    )

    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    # Check whether this tenant already has an active case
    active_case = (
        db.query(Case)
        .filter(
            Case.vin == scan.vin,
            Case.tenant_id == camera.tenant_id,
            Case.status == "active"
        )
        .first()
    )

    if active_case:
        return {
            "message": "Scan stored and matched to active case",
            "scan_id": new_scan.id,
            "case_id": active_case.id,
            "case_status": active_case.status
        }

    # No active case → create pending claim
    new_case = Case(
        vin=scan.vin,
        status="pending_claim",
        tenant_id=None,
        claimed_by=None
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return {
        "message": "Scan stored and pending case created",
        "scan_id": new_scan.id,
        "case_id": new_case.id,
        "case_status": new_case.status
    }