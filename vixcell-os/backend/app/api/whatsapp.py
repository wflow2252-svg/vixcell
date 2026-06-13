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


class ContactIn(BaseModel):
    name: str
    phone: str


class SendVoiceIn(BaseModel):
    to: str                 # lead name or phone number
    text: str               # what the voice note should say
    sent_by: str = "user"   # user | ai
    voice: Optional[str] = None  # explicit Edge voice override


@router.get("/contacts")
def list_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Saved WhatsApp contacts (the name→number address book)."""
    return {"items": whatsapp_service.list_contacts(db, current_user.tenant_id)}


@router.post("/contacts", status_code=status.HTTP_201_CREATED)
def add_contact(
    body: ContactIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Save a client's name + number so 'send to <name>' works afterwards."""
    try:
        return whatsapp_service.add_contact(db, current_user.tenant_id, body.name, body.phone)
    except WhatsAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


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


@router.post("/send-now")
def send_now(
    body: SendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """真-send: open WhatsApp Desktop and actually press send (not just prefill)."""
    try:
        return whatsapp_service.send_now(db, current_user.tenant_id, body.to,
                                         body.text, sent_by=body.sent_by)
    except WhatsAppError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


def _synthesize_voice_audio(db: Session, tenant_id: str, text: str,
                            voice: Optional[str] = None) -> bytes:
    """Generate speech bytes — ElevenLabs (human-grade) if the tenant set a key,
    otherwise the neural male Egyptian edge-tts voice. Mirrors /voice/speak."""
    from app.services import tts_engine
    try:
        from app.models.integration import IntegrationConfig
        row = (db.query(IntegrationConfig)
               .filter(IntegrationConfig.tenant_id == tenant_id,
                       IntegrationConfig.provider == "elevenlabs",
                       IntegrationConfig.enabled == True)  # noqa: E712
               .first())
        cfg = (row.config or {}) if row else {}
        if tts_engine.elevenlabs_available(cfg.get("api_key")):
            return tts_engine.synthesize_elevenlabs(text, cfg["api_key"], cfg.get("voice_id"))
    except Exception as e:
        logger.warning(f"ElevenLabs voice-note synth failed, using edge-tts: {e}")
    if not tts_engine.engine_available():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="محرك الصوت مش متاح — مش قادر أعمل الفويس")
    v = voice or tts_engine.pick_voice("ar", "male")
    return tts_engine.synthesize(text, voice=v, rate="+0%")


@router.post("/send-voice")
def send_voice(
    body: SendVoiceIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Send a voice message on WhatsApp: turn `text` into an audio file, then open
    the recipient's WhatsApp Desktop chat and paste+send the file. Needs the
    desktop app installed + computer control (Windows).
    """
    import uuid
    from pathlib import Path
    from app.core.config import settings

    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="اكتب الكلام اللي عايز الفويس يقوله")

    audio = _synthesize_voice_audio(db, current_user.tenant_id, text, body.voice)
    out_dir = Path(settings.UPLOAD_PATH) / "voice_notes"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"vn_{uuid.uuid4().hex}.mp3"
    path.write_bytes(audio)

    try:
        return whatsapp_service.send_voice_note(
            db, current_user.tenant_id, body.to, str(path),
            caption=text, sent_by=body.sent_by)
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
