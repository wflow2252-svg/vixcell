import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.core.database import Base


class AssistantMemory(Base):
    """
    Facts the assistant remembers about the user/business ("افتكر إن...").
    Injected into the local LLM's context so answers get personal over time.
    """
    __tablename__ = "assistant_memories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(20), default="voice")  # voice | manual
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
