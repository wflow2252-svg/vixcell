import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from app.core.database import Base


class WaContact(Base):
    """
    A WhatsApp recipient. Linked to a Lead when the number matches one, so the
    assistant can "send to <lead name>". Phone is stored international (no +).
    """
    __tablename__ = "wa_contacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=False)          # international digits, e.g. 201001234567
    last_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class WaMessage(Base):
    """
    A message the assistant prepared/sent (outbound) — or an inbound one if a
    reading integration is added later. For the deep-link send mode, every
    composed message is logged here so the WhatsApp page shows real history.
    """
    __tablename__ = "wa_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(String(36), ForeignKey("wa_contacts.id", ondelete="CASCADE"), nullable=True)
    direction = Column(String(8), default="out")        # out | in
    body = Column(Text, nullable=False)
    sent_by = Column(String(8), default="user")         # user | ai
    method = Column(String(16), default="link")         # link | cloud_api | web
    status = Column(String(16), default="composed")     # composed | sent | failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
