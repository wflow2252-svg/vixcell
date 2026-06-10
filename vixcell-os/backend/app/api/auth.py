from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security
from app.api.dependencies import get_db, get_current_active_user
from app.models.tenant import Tenant
from app.models.user import User, RefreshToken
from app.schemas.auth import Token, UserLogin, SetupWizard, UserOut
from app.core.config import settings
from jose import jwt, JWTError

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, retrieve access and refresh tokens.
    Used for Swagger interactive docs and traditional form posting.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
        
    # Create tokens
    access_token = security.create_access_token(subject=user.id)
    refresh_token_str = security.create_refresh_token(subject=user.id)
    
    # Save refresh token in DB
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
    }


@router.post("/login/json", response_model=Token)
def login_json(
    db: Session = Depends(get_db),
    credentials: UserLogin = Body(...)
):
    """
    JSON-based API login. Authenticates user and issues access/refresh tokens.
    """
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
        
    access_token = security.create_access_token(subject=user.id)
    refresh_token_str = security.create_refresh_token(subject=user.id)
    
    # Save refresh token
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    db: Session = Depends(get_db),
    refresh_token_in: str = Body(..., embed=True)
):
    """
    Generates a new access token using a valid, unrevoked refresh token.
    """
    try:
        payload = security.decode_token(refresh_token_in)
        subject = payload.get("sub")
        token_type = payload.get("type")
        if subject is None or token_type != "refresh":
            raise JWTError()
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
        
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token_in,
        RefreshToken.revoked == False
    ).first()
    
    if not db_token or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )
        
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
        
    # Re-issue both tokens (Refresh Token Rotation)
    new_access_token = security.create_access_token(subject=user.id)
    new_refresh_token_str = security.create_refresh_token(subject=user.id)
    
    # Revoke old token
    db_token.revoked = True
    
    # Add new refresh token
    db_new_token = RefreshToken(
        user_id=user.id,
        token=new_refresh_token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_new_token)
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token_str,
        "token_type": "bearer",
    }


@router.get("/wizard/status")
def wizard_status(db: Session = Depends(get_db)):
    """
    Checks if there are any companies (tenants) or users in the DB.
    If 0, the setup wizard needs to be completed by the client.
    """
    user_count = db.query(User).count()
    tenant_count = db.query(Tenant).count()
    
    return {
        "setup_required": user_count == 0 or tenant_count == 0,
        "user_count": user_count,
        "tenant_count": tenant_count
    }


@router.post("/wizard/setup", response_model=Token)
def wizard_setup(
    db: Session = Depends(get_db),
    setup_data: SetupWizard = Body(...)
):
    """
    Performs initial system setup. Creates the first Tenant (Company)
    and the first Administrator account.
    """
    # Enforce setup wizard run only once
    existing_users = db.query(User).count()
    if existing_users > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setup has already been completed.",
        )
        
    # 1. Create Tenant
    tenant = Tenant(
        name=setup_data.company_name,
        subdomain="default"
    )
    db.add(tenant)
    db.flush()  # Gen ID
    
    # 2. Create User
    hashed_pwd = security.get_password_hash(setup_data.admin_password)
    user = User(
        tenant_id=tenant.id,
        email=setup_data.admin_email,
        hashed_password=hashed_pwd,
        full_name=setup_data.admin_name,
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 3. Issue Authentication Tokens
    access_token = security.create_access_token(subject=user.id)
    refresh_token_str = security.create_refresh_token(subject=user.id)
    
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_active_user)):
    """
    Returns the currently logged in user profile.
    """
    return current_user
