from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .models import Camera, Scan, Case, User

from .database import SessionLocal
from .models import Camera, Scan, Case
from .schemas import ScanCreate, LoginRequest
from .auth import get_current_user

router = APIRouter(prefix="/api/v1")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


@router.get("/cases")
def get_cases(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    cases = (
        db.query(Case)
        .filter(
            (Case.tenant_id == current_user.tenant_id)
            | (Case.status == "pending_claim")
        )
        .all()
    )

    return cases


@router.get("/cases/{case_id}/scans")
def get_case_scans(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    # Pending cases are visible to every authenticated tenant.
    # Active/closed cases are only visible to their owning tenant.
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


@router.post("/cases/{case_id}/claim")
def claim_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    if case.status != "pending_claim":
        raise HTTPException(
            status_code=400,
            detail="Only pending cases can be claimed"
        )

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