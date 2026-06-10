from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

DEAL_STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"]


class DealBase(BaseModel):
    title: str
    amount: Optional[float] = 0.0
    stage: str = "Discovery"
    pipeline: Optional[str] = "Default"
    probability: Optional[int] = 0
    close_date: Optional[datetime] = None
    lead_id: Optional[str] = None
    assignee_id: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    stage: Optional[str] = None
    pipeline: Optional[str] = None
    probability: Optional[int] = None
    close_date: Optional[datetime] = None
    lead_id: Optional[str] = None
    assignee_id: Optional[str] = None


class DealOut(DealBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    lead_name: Optional[str] = None
    assignee_name: Optional[str] = None


class ActivityCreate(BaseModel):
    type: str  # 'call', 'email', 'meeting', 'task', 'note'
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    deal_id: Optional[str] = None
    lead_id: Optional[str] = None


class ActivityOut(ActivityCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    user_id: Optional[str] = None
    status: str
    created_at: datetime
