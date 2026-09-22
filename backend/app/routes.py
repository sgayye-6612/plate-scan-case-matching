from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post("/scans", status_code=status.HTTP_201_CREATED)
def create_scan(
    scan: ScanCreate,
    db: Session = Depends(get_db)
):
    # 1. Resolve camera and tenant
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

    # 2. Store every scan
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

    # 3. Check for an active case belonging to this tenant
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

    # 4. Mock partner eligibility
    eligible = True

    if not eligible:
        return {
            "message": "Scan stored, but vehicle is not eligible",
            "scan_id": new_scan.id,
            "case_created": False
        }

    # 5. Avoid duplicate pending cases
    existing_pending_case = (
        db.query(Case)
        .filter(
            Case.vin == scan.vin,
            Case.status == "pending_claim"
        )
        .first()
    )

    if existing_pending_case:
        return {
            "message": "Scan stored; pending case already exists",
            "scan_id": new_scan.id,
            "case_id": existing_pending_case.id,
            "case_status": existing_pending_case.status
        }

    # 6. Create a new pending case
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


@router.post("/mock/partner-network/eligibility")
def check_eligibility(vin: str):
    return {
        "vin": vin,
        "still_eligible_for_repo": True
    }