from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = Field(..., description="Role must be one of: admin, manager, sales, support, viewer")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "strongpassword123",
                "full_name": "John Doe",
                "role": "admin"
            }
        }

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: str
    tenant_id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SetupWizard(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    admin_name: str = Field(..., min_length=2, max_length=255)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8, max_length=128)

    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "Acme Marketing LLC",
                "admin_name": "Administrator",
                "admin_email": "admin@acme.com",
                "admin_password": "supersecurepassword123"
            }
        }
