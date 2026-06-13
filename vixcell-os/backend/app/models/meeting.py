import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from app.core.database import Base


class Meeting(Base):
    """
    An AI meeting record: the transcript (Whisper) plus the LLM-generated
    summary, decisions and extracted action items. Action items also become
    native tasks (source='ai_meeting'). The live video room itself runs on
    vixcell.com; this is the intelligence layer over a meeting's audio/notes.
    """
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    decisions = Column(JSON, nullable=True)        # ["...", "..."]
    action_items = Column(JSON, nullable=True)      # ["...", "..."]
    source = Column(String(16), default="audio")   # audio | text
    duration_sec = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
