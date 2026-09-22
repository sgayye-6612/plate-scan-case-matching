from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Camera, Scan, Case, User
from .schemas import ScanCreate, LoginRequest
from .auth import get_current_user


router = APIRouter(prefix="/api/v1")


# ---------------------------------------------------------
# DATABASE DEPENDENCY
# ---------------------------------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# MOCK PARTNER ELIGIBILITY
# ---------------------------------------------------------

def check_partner_eligibility(vin):
    # Mock partner/lender eligibility check
    # VINs ending with "99999" are treated as not eligible.
    return not vin.endswith("99999")


@router.post("/mock/partner-network/eligibility")
def partner_eligibility(vin: str):
    """
    Mock endpoint representing an external partner/lender
    eligibility service.
    """

    return {
        "vin": vin,
        "still_eligible_for_repo": check_partner_eligibility(vin)
    }


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(
            User.username == request.username,
            User.password == request.password
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return {
        "message": "Login successful",
        "username": user.username,
        "user_id": user.id,
        "tenant_id": user.tenant_id
    }


# ---------------------------------------------------------
# CREATE SCAN
# ---------------------------------------------------------

@router.post("/scans")
def create_scan(
    scan_data: ScanCreate,
    db: Session = Depends(get_db)
):
    """
    Camera webhook.

    Flow:

    1. Find camera using camera_id.
    2. Resolve the camera's tenant.
    3. Store every scan.
    4. Check whether that tenant already has
       an active case for the VIN.
    5. If active case exists, return the match.
    6. Otherwise check partner eligibility.
    7. If eligible, create a pending_claim case.
    """

    # -----------------------------------------
    # Find camera
    # -----------------------------------------

    camera = (
        db.query(Camera)
        .filter(Camera.camera_id == scan_data.camera_id)
        .first()
    )

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    # -----------------------------------------
    # Store every scan
    # -----------------------------------------

    new_scan = Scan(
        camera_id=camera.id,
        plate=scan_data.plate,
        vin=scan_data.vin,
        latitude=scan_data.latitude,
        longitude=scan_data.longitude,
        scanned_at=scan_data.scanned_at,
        image_url=scan_data.image_url
    )

    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    # -----------------------------------------
    # Check for active case for this tenant
    # -----------------------------------------

    active_case = (
        db.query(Case)
        .filter(
            Case.vin == scan_data.vin,
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
            "case_status": active_case.status,
            "tenant_id": camera.tenant_id
        }

    # -----------------------------------------
    # Check if pending case already exists
    # -----------------------------------------

    existing_pending_case = (
        db.query(Case)
        .filter(
            Case.vin == scan_data.vin,
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

    # -----------------------------------------
    # Partner eligibility check
    # -----------------------------------------

    eligible = check_partner_eligibility(scan_data.vin)

    if not eligible:
        return {
            "message": "Scan stored but vehicle is not eligible",
            "scan_id": new_scan.id,
            "case_created": False
        }

    # -----------------------------------------
    # Create pending claim
    # -----------------------------------------

    pending_case = Case(
        vin=scan_data.vin,
        status="pending_claim",
        tenant_id=None,
        claimed_by=None
    )

    db.add(pending_case)
    db.commit()
    db.refresh(pending_case)

    return {
        "message": "Scan stored and pending case created",
        "scan_id": new_scan.id,
        "case_id": pending_case.id,
        "case_status": pending_case.status
    }


# ---------------------------------------------------------
# GET CASES
# ---------------------------------------------------------

@router.get("/cases")
def get_cases(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Tenant isolation rules:

    - Own tenant's active/closed cases are visible.
    - Pending claim cases are visible to every tenant.
    - Other tenants' active/closed cases are hidden.
    """

    query = db.query(Case).filter(
        (Case.tenant_id == current_user.tenant_id)
        | (Case.status == "pending_claim")
    )

    # Optional status filter
    if status:
        query = query.filter(Case.status == status)

    cases = query.all()

    return cases


# ---------------------------------------------------------
# GET CASE SCANS
# ---------------------------------------------------------

@router.get("/cases/{case_id}/scans")
def get_case_scans(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    case = (
        db.query(Case)
        .filter(Case.id == case_id)
        .first()
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    # Pending cases are visible to every authenticated tenant.
    #
    # Active/closed cases are only visible to their
    # owning tenant.

    if (
        case.status != "pending_claim"
        and case.tenant_id != current_user.tenant_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this case"
        )

    scans = (
        db.query(Scan)
        .filter(Scan.vin == case.vin)
        .order_by(Scan.scanned_at)
        .all()
    )

    return scans


# ---------------------------------------------------------
# CLAIM CASE
# ---------------------------------------------------------

@router.post("/cases/{case_id}/claim")
def claim_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    case = (
        db.query(Case)
        .filter(Case.id == case_id)
        .first()
    )

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    # Only pending cases can be claimed
    if case.status != "pending_claim":
        raise HTTPException(
            status_code=400,
            detail="Only pending cases can be claimed"
        )

    # Assign the case to the claiming user's tenant
    case.status = "active"
    case.tenant_id = current_user.tenant_id
    case.claimed_by = current_user.id

    db.commit()
    db.refresh(case)

    return {
        "message": "Case claimed successfully",
        "case_id": case.id,
        "status": case.status,
        "tenant_id": case.tenant_id,
        "claimed_by": case.claimed_by
    }