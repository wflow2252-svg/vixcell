from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LeadBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = 0
    social_links: Optional[Dict[str, Any]] = None
    category: Optional[str] = None
    status: Optional[str] = "new"
    source: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    social_links: Optional[Dict[str, Any]] = None
    category: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class LeadOut(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    lead_score: int
    created_at: datetime
    updated_at: datetime


class LeadListOut(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    page_size: int
