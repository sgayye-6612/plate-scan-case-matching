from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def login(username, password="password123"):
    response = client.post(
        "/api/v1/login",
        json={
            "username": username,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()


def auth_headers(username):
    return {
        "Authorization": f"Bearer {username}"
    }


def test_login():
    response = client.post(
        "/api/v1/login",
        json={
            "username": "agent_a",
            "password": "password123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Login successful"
    assert data["username"] == "agent_a"
    assert data["user_id"] is not None
    assert data["tenant_id"] is not None


def test_existing_case_scan_is_matched():
    response = client.post(
        "/api/v1/scans",
        json={
            "camera_id": "cam_1001",
            "plate": "7XYZ123",
            "vin": "1FTFW1E51NFA12345",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "scanned_at": datetime.now().isoformat(),
            "image_url": "https://example.com/test.jpg",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Scan stored and matched to active case"
    assert data["scan_id"] is not None
    assert data["case_id"] is not None
    assert data["case_status"] == "active"
    assert data["tenant_id"] is not None


def test_new_scan_creates_pending_case():
    unique_vin = f"TESTVIN{uuid4().hex[:10].upper()}"

    response = client.post(
        "/api/v1/scans",
        json={
            "camera_id": "cam_2050",
            "plate": "TEST123",
            "vin": unique_vin,
            "latitude": 33.4484,
            "longitude": -112.0740,
            "scanned_at": datetime.now().isoformat(),
            "image_url": "https://example.com/test.jpg",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Scan stored and pending case created"
    assert data["scan_id"] is not None
    assert data["case_id"] is not None
    assert data["case_status"] == "pending_claim"


def test_pending_case_can_be_claimed():
    agent_b = login("agent_b")

    response = client.get(
        "/api/v1/cases",
        headers=auth_headers("agent_b"),
    )

    assert response.status_code == 200

    cases = response.json()

    pending_cases = [
        case
        for case in cases
        if case["status"] == "pending_claim"
    ]

    assert len(pending_cases) > 0

    case_id = pending_cases[0]["id"]

    claim_response = client.post(
        f"/api/v1/cases/{case_id}/claim",
        headers=auth_headers("agent_b"),
    )

    assert claim_response.status_code == 200

    data = claim_response.json()

    assert data["message"] == "Case claimed successfully"
    assert data["case_id"] == case_id
    assert data["status"] == "active"
    assert data["tenant_id"] == agent_b["tenant_id"]
    assert data["claimed_by"] == agent_b["user_id"]


def test_tenant_isolation():
    agent_b = login("agent_b")

    response = client.get(
        "/api/v1/cases",
        headers=auth_headers("agent_b"),
    )

    assert response.status_code == 200

    cases = response.json()

    for case in cases:
        assert (
            case["tenant_id"] == agent_b["tenant_id"]
            or case["status"] == "pending_claim"
        )


def test_unauthorized_case_access():
    response = client.get("/api/v1/cases")

    assert response.status_code == 401