import pytest
from app.models.user import User
from app.models.tenant import Tenant

def test_internal_app_key_block(client):
    """
    Verify requests are rejected if the internal application header is missing or incorrect.
    """
    # Create a new client without default headers
    from fastapi.testclient import TestClient
    from app.main import app
    
    unsecured_client = TestClient(app)
    # Call health check (bypassed)
    response = unsecured_client.get("/health")
    assert response.status_code == 200
    
    # Call protected endpoint (fails)
    response = unsecured_client.get("/api/v1/auth/wizard/status")
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden. Unauthorized internal application access."
    
    # Add wrong key (fails)
    response = unsecured_client.get("/api/v1/auth/wizard/status", headers={"X-Vixcell-Internal-Key": "wrong_key"})
    assert response.status_code == 403


def test_auto_login(client, db):
    """
    Desktop single-user mode: /auth/auto-login issues admin tokens without
    a password once setup is done, and 404s before any admin exists.
    """
    # Before setup: no admin yet
    response = client.post("/api/v1/auth/auto-login")
    assert response.status_code == 404

    client.post("/api/v1/auth/wizard/setup", json={
        "company_name": "Auto Org",
        "admin_name": "Auto Admin",
        "admin_email": "auto@test.com",
        "admin_password": "supersecurepassword123",
    })

    response = client.post("/api/v1/auth/auto-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data and "refresh_token" in data

    # Token actually works against a protected endpoint
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "auto@test.com"


def test_setup_wizard_flow(client, db):
    """
    Test the full initialization flow: status check -> setup submission -> token check.
    """
    # 1. Check status (setup should be required)
    response = client.get("/api/v1/auth/wizard/status")
    assert response.status_code == 200
    assert response.json()["setup_required"] is True
    
    # 2. Run Setup
    setup_payload = {
        "company_name": "Test Org",
        "admin_name": "Admin User",
        "admin_email": "admin@test.com",
        "admin_password": "supersecurepassword123"
    }
    response = client.post("/api/v1/auth/wizard/setup", json=setup_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    
    # 3. Check status again (setup should NOT be required now)
    response = client.get("/api/v1/auth/wizard/status")
    assert response.status_code == 200
    assert response.json()["setup_required"] is False
    
    # 4. Check database contents
    assert db.query(Tenant).count() == 1
    assert db.query(User).count() == 1
    
    # 5. Prevent running setup again
    response = client.post("/api/v1/auth/wizard/setup", json=setup_payload)
    assert response.status_code == 400
    assert "Setup has already been completed" in response.json()["detail"]


def test_user_login(client):
    """
    Test authentication login and profile reading.
    """
    # Setup the system first
    setup_payload = {
        "company_name": "Test Org",
        "admin_name": "Admin User",
        "admin_email": "admin@test.com",
        "admin_password": "supersecurepassword123"
    }
    client.post("/api/v1/auth/wizard/setup", json=setup_payload)
    
    # 1. Login with invalid credentials
    login_payload = {
        "email": "admin@test.com",
        "password": "wrong_password"
    }
    response = client.post("/api/v1/auth/login/json", json=login_payload)
    assert response.status_code == 400
    assert "Incorrect email or password" in response.json()["detail"]
    
    # 2. Login with correct credentials
    login_payload["password"] = "supersecurepassword123"
    response = client.post("/api/v1/auth/login/json", json=login_payload)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    
    # 3. Retrieve user profile
    token = tokens["access_token"]
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "admin@test.com"
    assert profile["full_name"] == "Admin User"
    assert profile["role"] == "admin"


def test_token_refresh(client):
    """
    Test token rotation and old token revocation.
    """
    # Setup
    setup_payload = {
        "company_name": "Test Org",
        "admin_name": "Admin User",
        "admin_email": "admin@test.com",
        "admin_password": "supersecurepassword123"
    }
    setup_res = client.post("/api/v1/auth/wizard/setup", json=setup_payload).json()
    refresh_token = setup_res["refresh_token"]
    
    # 1. Refresh with valid token
    response = client.post("/api/v1/auth/refresh", json={"refresh_token_in": refresh_token})
    assert response.status_code == 200
    new_tokens = response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["refresh_token"] != refresh_token
    
    # 2. Refreshing again with the revoked OLD token should fail (replay protection)
    response = client.post("/api/v1/auth/refresh", json={"refresh_token_in": refresh_token})
    assert response.status_code == 401
    assert "expired or revoked" in response.json()["detail"]
