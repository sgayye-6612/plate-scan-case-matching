from datetime import datetime, timezone

from .database import SessionLocal
from .models import Tenant, User, Camera, Case, Scan


db = SessionLocal()

try:
    # -------------------------
    # Tenants
    # -------------------------
    tenant_a = Tenant(name="Recovery Agency A")
    tenant_b = Tenant(name="Recovery Agency B")

    db.add_all([tenant_a, tenant_b])
    db.commit()

    # -------------------------
    # Users
    # -------------------------
    user_a = User(
        username="agent_a",
        password="password123",
        role="staff",
        tenant_id=tenant_a.id
    )

    user_b = User(
        username="agent_b",
        password="password123",
        role="staff",
        tenant_id=tenant_b.id
    )

    db.add_all([user_a, user_b])
    db.commit()

    # -------------------------
    # Cameras
    # -------------------------
    camera_a = Camera(
        camera_id="cam_1001",
        tenant_id=tenant_a.id
    )

    camera_b = Camera(
        camera_id="cam_2050",
        tenant_id=tenant_b.id
    )

    db.add_all([camera_a, camera_b])
    db.commit()

    # -------------------------
    # Existing active case
    # Tenant A already tracks this VIN
    # -------------------------
    active_case = Case(
        vin="1FTFW1E51NFA12345",
        status="active",
        tenant_id=tenant_a.id,
        claimed_by=user_a.id
    )

    db.add(active_case)
    db.commit()

    # -------------------------
    # Older scans for Tenant A
    # -------------------------
    scan_1 = Scan(
        camera_id=camera_a.id,
        plate="7XYZ123",
        vin="1FTFW1E51NFA12345",
        latitude=33.7490,
        longitude=-84.3880,
        scanned_at=datetime(2026, 8, 28, 10, 30, tzinfo=timezone.utc),
        image_url="https://example.com/image1.jpg"
    )

    scan_2 = Scan(
        camera_id=camera_a.id,
        plate="7XYZ123",
        vin="1FTFW1E51NFA12345",
        latitude=33.7500,
        longitude=-84.3900,
        scanned_at=datetime(2026, 8, 30, 14, 15, tzinfo=timezone.utc),
        image_url="https://example.com/image2.jpg"
    )

    db.add_all([scan_1, scan_2])
    db.commit()

    print("Seed data created successfully!")

finally:
    db.close()