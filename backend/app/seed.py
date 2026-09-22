from datetime import datetime

from app.database import SessionLocal, Base, engine
from app.models import Tenant, User, Camera, Case, Scan


Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Clear old demo data
    db.query(Scan).delete()
    db.query(Case).delete()
    db.query(Camera).delete()
    db.query(User).delete()
    db.query(Tenant).delete()
    db.commit()

    # -------------------------
    # TENANTS
    # -------------------------

    tenant_a = Tenant(name="Recovery Agency A")
    tenant_b = Tenant(name="Recovery Agency B")

    db.add_all([tenant_a, tenant_b])
    db.commit()

    # -------------------------
    # USERS
    # -------------------------

    agent_a = User(
        username="agent_a",
        password="password123",
        role="staff",
        tenant_id=tenant_a.id,
    )

    agent_b = User(
        username="agent_b",
        password="password123",
        role="staff",
        tenant_id=tenant_b.id,
    )

    db.add_all([agent_a, agent_b])
    db.commit()

    # -------------------------
    # CAMERAS
    # -------------------------

    camera_a = Camera(
        camera_id="cam_1001",
        tenant_id=tenant_a.id,
    )

    camera_b = Camera(
        camera_id="cam_2050",
        tenant_id=tenant_b.id,
    )

    db.add_all([camera_a, camera_b])
    db.commit()

    # -------------------------
    # CASE 1 - AGENT A
    # EAST COAST - 6 SCANS
    # -------------------------

    case_1 = Case(
        vin="1FTFW1E51NFA12345",
        status="active",
        tenant_id=tenant_a.id,
        claimed_by=agent_a.id,
    )

    db.add(case_1)
    db.commit()

    case_1_scans = [
        Scan(
            camera_id=camera_a.id,
            plate="7XYZ123",
            vin="1FTFW1E51NFA12345",
            latitude=33.7490,
            longitude=-84.3880,
            scanned_at=datetime(2026, 9, 18, 8, 30),
            image_url="https://example.com/vehicle1.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="7XYZ123",
            vin="1FTFW1E51NFA12345",
            latitude=33.7490,
            longitude=-84.3880,
            scanned_at=datetime(2026, 9, 18, 14, 45),
            image_url="https://example.com/vehicle1.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="7XYZ123",
            vin="1FTFW1E51NFA12345",
            latitude=40.7357,
            longitude=-74.1724,
            scanned_at=datetime(2026, 9, 19, 10, 20),
            image_url="https://example.com/vehicle1.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="7XYZ123",
            vin="1FTFW1E51NFA12345",
            latitude=40.7128,
            longitude=-74.0060,
            scanned_at=datetime(2026, 9, 19, 13, 15),
            image_url="https://example.com/vehicle1.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="7XYZ123",
            vin="1FTFW1E51NFA12345",
            latitude=41.7658,
            longitude=-72.6734,
            scanned_at=datetime(2026, 9, 20, 15, 40),
            image_url="https://example.com/vehicle1.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="7XYZ123",
            vin="1FTFW1E51NFA12345",
            latitude=39.3643,
            longitude=-74.4229,
            scanned_at=datetime(2026, 9, 21, 14, 30),
            image_url="https://example.com/vehicle1.jpg",
        ),
    ]

    db.add_all(case_1_scans)
    db.commit()

    # -------------------------
    # CASE 2 - AGENT A
    # SOUTHWEST - 3 SCANS
    # -------------------------

    case_2 = Case(
        vin="5NPE34AF9KH123456",
        status="active",
        tenant_id=tenant_a.id,
        claimed_by=agent_a.id,
    )

    db.add(case_2)
    db.commit()

    case_2_scans = [
        Scan(
            camera_id=camera_a.id,
            plate="5ABC789",
            vin="5NPE34AF9KH123456",
            latitude=36.1699,
            longitude=-115.1398,
            scanned_at=datetime(2026, 9, 15, 9, 20),
            image_url="https://example.com/vehicle2.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="5ABC789",
            vin="5NPE34AF9KH123456",
            latitude=36.1699,
            longitude=-115.1398,
            scanned_at=datetime(2026, 9, 16, 15, 40),
            image_url="https://example.com/vehicle2.jpg",
        ),
        Scan(
            camera_id=camera_a.id,
            plate="5ABC789",
            vin="5NPE34AF9KH123456",
            latitude=33.4484,
            longitude=-112.0740,
            scanned_at=datetime(2026, 9, 17, 11, 15),
            image_url="https://example.com/vehicle2.jpg",
        ),
    ]

    db.add_all(case_2_scans)
    db.commit()

    # -------------------------
    # CASE 3 - AGENT B
    # -------------------------

    case_3 = Case(
        vin="2FTAB1C23PFA98765",
        status="active",
        tenant_id=tenant_b.id,
        claimed_by=agent_b.id,
    )

    db.add(case_3)
    db.commit()

    # -------------------------
    # CASE 4 - PENDING CLAIM
    # Visible to BOTH agents
    # -------------------------

    case_4 = Case(
        vin="3C6UR5DL5NG123456",
        status="pending_claim",
        tenant_id=None,
        claimed_by=None,
    )

    db.add(case_4)
    db.commit()

    # -------------------------
    # SUCCESS
    # -------------------------

    print()
    print("Database seeded successfully!")
    print()
    print("Users:")
    print("agent_a / password123")
    print("agent_b / password123")
    print()
    print("Cases:")
    print("Case 1 - Agent A - East Coast - 6 scans")
    print("Case 2 - Agent A - Southwest - 3 scans")
    print("Case 3 - Agent B - Active")
    print("Case 4 - Pending Claim - Both Agents")
    print()

except Exception as e:
    db.rollback()
    print("Seed failed:")
    print(e)

finally:
    db.close()