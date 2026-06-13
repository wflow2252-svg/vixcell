"""
WhatsApp endpoints — deep-link send + outbound history.
The assistant resolves a recipient and returns a wa.me link the client opens.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.models.whatsapp import WaContact, WaMessage
from app.services import whatsapp_service
from app.services.whatsapp_service import WhatsAppError

logger = logging.getLogger(__name__)
router = APIRouter()


class SendIn(BaseModel):
    to: str                 # lead name or phone number
    text: str
    sent_by: str = "user"   # user | ai


@router.post("/send")
def send_whatsapp(
    body: SendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Resolve recipient + build a pre-filled wa.me link + log it. The client
    opens the returned link to actually send (one tap in WhatsApp).
    """
    try:
        return whatsapp_service.prepare_send(db, current_user.tenant_id, body.to,
                                             body.text, sent_by=body.sent_by)
    except WhatsAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/resolve")
def resolve(
    q: str = Query(..., description="Lead name or phone"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Preview who a name/number resolves to, without sending."""
    try:
        return whatsapp_service.resolve_recipient(db, current_user.tenant_id, q)
    except WhatsAppError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/history")
def history(
    contact_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Recent contacts and the messages composed for them."""
    contacts = (
        db.query(WaContact)
        .filter(WaContact.tenant_id == current_user.tenant_id)
        .order_by(WaContact.last_sent_at.desc().nullslast())
        .limit(50)
        .all()
    )
    msg_q = db.query(WaMessage).filter(WaMessage.tenant_id == current_user.tenant_id)
    if contact_id:
        msg_q = msg_q.filter(WaMessage.contact_id == contact_id)
    messages = msg_q.order_by(WaMessage.created_at.desc()).limit(limit).all()
    return {
        "contacts": [
            {"id": c.id, "name": c.name, "phone": c.phone,
             "last_sent_at": c.last_sent_at.isoformat() if c.last_sent_at else None}
            for c in contacts
        ],
        "messages": [
            {"id": m.id, "contact_id": m.contact_id, "body": m.body,
             "direction": m.direction, "sent_by": m.sent_by,
             "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in messages
        ],
    }
