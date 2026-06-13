import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from app.core.database import Base


class InteractionLog(Base):
    """
    Every command the AI Core handles — voice, text, or notch. This is the
    backbone of the spec's 'log everything → prepare fine-tuning datasets':
    one row per command with the resolved intent, action and outcome.
    """
    __tablename__ = "interaction_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    channel = Column(String(16), default="voice")       # voice | text | notch
    input = Column(Text, nullable=True)                 # transcript / typed text
    intent = Column(String(64), nullable=True)
    params = Column(JSON, nullable=True)
    result = Column(Text, nullable=True)                # speech / outcome summary
    success = Column(Boolean, default=True)
    model = Column(String(64), nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
