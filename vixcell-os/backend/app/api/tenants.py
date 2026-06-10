from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantOut

router = APIRouter()

# Instantiate RBAC checkers
admin_only = RoleChecker(allowed_roles=["admin"])
admin_or_manager = RoleChecker(allowed_roles=["admin", "manager"])

@router.get("/", response_model=List[TenantOut])
def read_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    """
    List all companies. Accessible only by system Admin.
    """
    return db.query(Tenant).all()


@router.post("/", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
def create_tenant(
    db: Session = Depends(get_db),
    tenant_in: TenantCreate = Body(...),
    current_user: User = Depends(admin_only)
):
    """
    Creates a new company/tenant. Accessible only by system Admin.
    """
    # Check for subdomain conflicts if specified
    if tenant_in.subdomain:
        existing = db.query(Tenant).filter(Tenant.subdomain == tenant_in.subdomain).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain already in use",
            )
            
    tenant = Tenant(
        name=tenant_in.name,
        subdomain=tenant_in.subdomain,
        logo_url=tenant_in.logo_url
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/{tenant_id}", response_model=TenantOut)
def read_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_manager)
):
    """
    Retrieve specific tenant details. Non-admin users can only view their own company.
    """
    # Enforce tenant isolation
    if current_user.role != "admin" and current_user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this company's details"
        )
        
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    return tenant


@router.put("/{tenant_id}", response_model=TenantOut)
def update_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    tenant_in: TenantUpdate = Body(...),
    current_user: User = Depends(admin_or_manager)
):
    """
    Updates company details. Admin can update any, Managers can update their own.
    """
    if current_user.role != "admin" and current_user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this company's details"
        )
        
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
        
    update_data = tenant_in.model_dump(exclude_unset=True)
    
    # Check subdomain conflict if it changes
    if "subdomain" in update_data and update_data["subdomain"] != tenant.subdomain:
        existing = db.query(Tenant).filter(
            Tenant.subdomain == update_data["subdomain"],
            Tenant.id != tenant_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain already in use",
            )
            
    for field, value in update_data.items():
        setattr(tenant, field, value)
        
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    """
    Deletes a company and all related data (cascade delete). System Admin only.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    db.delete(tenant)
    db.commit()
    return None
