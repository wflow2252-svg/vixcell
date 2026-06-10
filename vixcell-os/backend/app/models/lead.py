import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    website = Column(String(512), nullable=True)
    address = Column(Text, nullable=True)
    rating = Column(Numeric(3, 2), nullable=True)
    review_count = Column(Integer, default=0)
    
    # Store social media links as JSON: {"facebook": "...", "linkedin": "..."}
    social_links = Column(JSON, nullable=True)
    
    lead_score = Column(Integer, default=0)
    category = Column(String(100), nullable=True)  # 'Warm', 'Cold', 'Hot'
    status = Column(String(50), default="new")      # 'new', 'contacted', 'qualified', 'nurturing'
    source = Column(String(100), nullable=True)     # 'Google Maps', 'Web Scraping', etc.
    notes = Column(Text, nullable=True)
    
    # Store user-defined attributes as JSON
    custom_fields = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="leads")
    deals = relationship("Deal", back_populates="lead", cascade="all, delete-orphan")
    activities = relationship("CRMActivity", back_populates="lead", cascade="all, delete-orphan")
