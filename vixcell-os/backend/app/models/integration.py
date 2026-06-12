import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from app.core.database import Base


class IntegrationConfig(Base):
    """
    Per-tenant external service credentials (WhatsApp, Meta, Google, SMTP...).
    Stored locally in the desktop SQLite database — never leaves the machine.
    """
    __tablename__ = "integration_configs"
    __table_args__ = (UniqueConstraint("tenant_id", "provider", name="uq_tenant_provider"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)   # whatsapp | meta | google_business | smtp
    enabled = Column(Boolean, default=True)
    config = Column(JSON, nullable=True)            # provider-specific fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
