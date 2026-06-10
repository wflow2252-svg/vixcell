import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), unique=True, nullable=True)
    logo_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="tenant", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="tenant", cascade="all, delete-orphan")
    social_accounts = relationship("SocialMediaAccount", back_populates="tenant", cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="tenant", cascade="all, delete-orphan")
    knowledge_bases = relationship("KnowledgeBase", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")
    voice_logs = relationship("VoiceLog", back_populates="tenant", cascade="all, delete-orphan")
