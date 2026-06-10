from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    subdomain: Optional[str] = Field(None, max_length=100)
    logo_url: Optional[str] = Field(None, max_length=512)

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    subdomain: Optional[str] = None
    logo_url: Optional[str] = None

class TenantOut(BaseModel):
    id: str
    name: str
    subdomain: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
