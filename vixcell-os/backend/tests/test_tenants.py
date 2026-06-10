import pytest
from app.models.tenant import Tenant
from app.models.user import User
from app.core import security

def create_user_with_role(db, tenant_id: str, email: str, role: str) -> User:
    user = User(
        tenant_id=tenant_id,
        email=email,
        hashed_password=security.get_password_hash("password123"),
        full_name=f"{role.capitalize()} User",
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_tenant_crud_by_admin(client, db):
    """
    Verify full Tenant CRUD operations by admin user.
    """
    # 1. Setup Admin and default Tenant
    setup_payload = {
        "company_name": "Admin Tenant",
        "admin_name": "Admin User",
        "admin_email": "admin@test.com",
        "admin_password": "supersecurepassword123"
    }
    setup_tokens = client.post("/api/v1/auth/wizard/setup", json=setup_payload).json()
    admin_token = setup_tokens["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 2. Create Tenant (POST)
    new_tenant = {
        "name": "Second Tenant",
        "subdomain": "second",
        "logo_url": "http://logo.com"
    }
    response = client.post("/api/v1/tenants/", json=new_tenant, headers=headers)
    assert response.status_code == 201
    created_tenant = response.json()
    assert created_tenant["name"] == "Second Tenant"
    assert created_tenant["subdomain"] == "second"
    tenant_id = created_tenant["id"]
    
    # 3. Read Tenants (GET list)
    response = client.get("/api/v1/tenants/", headers=headers)
    assert response.status_code == 200
    tenants = response.json()
    assert len(tenants) == 2  # default setup one + Second Tenant
    
    # 4. Read Tenant (GET single)
    response = client.get(f"/api/v1/tenants/{tenant_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Second Tenant"
    
    # 5. Update Tenant (PUT)
    response = client.put(f"/api/v1/tenants/{tenant_id}", json={"name": "Updated Second"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Second"
    
    # 6. Delete Tenant (DELETE)
    response = client.delete(f"/api/v1/tenants/{tenant_id}", headers=headers)
    assert response.status_code == 204
    
    # Verify deletion
    response = client.get(f"/api/v1/tenants/{tenant_id}", headers=headers)
    assert response.status_code == 404


def test_tenant_rbac_restrictions(client, db):
    """
    Verify that non-admin roles are restricted according to RBAC.
    """
    # 1. Setup Admin and default Tenant
    setup_payload = {
        "company_name": "Admin Tenant",
        "admin_name": "Admin User",
        "admin_email": "admin@test.com",
        "admin_password": "supersecurepassword123"
    }
    setup_tokens = client.post("/api/v1/auth/wizard/setup", json=setup_payload).json()
    admin_tenant = db.query(Tenant).first()
    
    # 2. Create a Viewer user in that Tenant
    viewer = create_user_with_role(db, admin_tenant.id, "viewer@test.com", "viewer")
    viewer_token = security.create_access_token(subject=viewer.id)
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    
    # 3. Viewer attempts to create a tenant (should fail)
    response = client.post("/api/v1/tenants/", json={"name": "Illegal"}, headers=viewer_headers)
    assert response.status_code == 403
    
    # 4. Viewer attempts to read all tenants (should fail)
    response = client.get("/api/v1/tenants/", headers=viewer_headers)
    assert response.status_code == 403


def test_tenant_isolation(client, db):
    """
    Verify that managers cannot view or edit other tenants.
    """
    # 1. Setup Tenant A
    setup_payload = {
        "company_name": "Tenant A",
        "admin_name": "Admin A",
        "admin_email": "admina@test.com",
        "admin_password": "supersecurepassword123"
    }
    setup_tokens = client.post("/api/v1/auth/wizard/setup", json=setup_payload).json()
    tenant_a = db.query(Tenant).filter(Tenant.name == "Tenant A").first()
    admin_token_a = setup_tokens["access_token"]
    
    # 2. Create Tenant B (as Admin A)
    headers_a = {"Authorization": f"Bearer {admin_token_a}"}
    tenant_b_res = client.post("/api/v1/tenants/", json={"name": "Tenant B"}, headers=headers_a).json()
    tenant_b_id = tenant_b_res["id"]
    
    # 3. Create a Manager in Tenant B
    manager_b = create_user_with_role(db, tenant_b_id, "managerb@test.com", "manager")
    manager_b_token = security.create_access_token(subject=manager_b.id)
    headers_manager_b = {"Authorization": f"Bearer {manager_b_token}"}
    
    # 4. Manager B attempts to read Tenant A (should fail)
    response = client.get(f"/api/v1/tenants/{tenant_a.id}", headers=headers_manager_b)
    assert response.status_code == 403
    assert "permission to view this company" in response.json()["detail"]
    
    # 5. Manager B attempts to update Tenant A (should fail)
    response = client.put(f"/api/v1/tenants/{tenant_a.id}", json={"name": "Hacked A"}, headers=headers_manager_b)
    assert response.status_code == 403
    
    # 6. Manager B reads Tenant B (should succeed)
    response = client.get(f"/api/v1/tenants/{tenant_b_id}", headers=headers_manager_b)
    assert response.status_code == 200
    assert response.json()["name"] == "Tenant B"
