import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Task(Base):
    """
    A native, local task. Spec: 'AI should generate tasks automatically from
    chats and meetings.' source records where it came from. Distinct from the
    website-bridge tasks (those live on vixcell.com via the website module).
    """
    __tablename__ = "core_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(16), default="todo")     # todo | doing | done
    priority = Column(String(16), default="medium")  # low | medium | high
    source = Column(String(16), default="manual")    # manual | ai_chat | ai_meeting | voice
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="tasks")
