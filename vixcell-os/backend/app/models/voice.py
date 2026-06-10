import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class VoiceLog(Base):
    __tablename__ = "voice_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String(50), nullable=True)
    direction = Column(String(20), nullable=False)  # 'inbound', 'outbound'
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    audio_url = Column(String(512), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="voice_logs")
