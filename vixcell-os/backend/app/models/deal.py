import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Deal(Base):
    __tablename__ = "deals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), default=0.00)
    stage = Column(String(100), nullable=False)  # 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'
    pipeline = Column(String(100), default="Default")
    probability = Column(Integer, default=0)      # 0 to 100
    close_date = Column(DateTime, nullable=True)
    assignee_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="deals")
    lead = relationship("Lead", back_populates="deals")
    assignee = relationship("User", back_populates="deals")
    activities = relationship("CRMActivity", back_populates="deal", cascade="all, delete-orphan")


class CRMActivity(Base):
    __tablename__ = "crm_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    deal_id = Column(String(36), ForeignKey("deals.id", ondelete="CASCADE"), nullable=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    type = Column(String(50), nullable=False)  # 'call', 'email', 'meeting', 'task', 'note'
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending")  # 'pending', 'completed'
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    deal = relationship("Deal", back_populates="activities")
    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", back_populates="activities")
