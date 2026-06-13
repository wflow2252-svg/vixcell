"""
WhatsApp service — deep-link send mode.

Resolves a recipient (a Lead name or a spoken/typed number), normalises it to
an international WhatsApp number, builds a wa.me link with the message
pre-filled, and logs the outbound message. The actual "send" happens when the
client opens the link in WhatsApp (Desktop/Web) and taps send — zero setup,
works with any number.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.models.whatsapp import WaContact, WaMessage

logger = logging.getLogger(__name__)

DEFAULT_CC = "20"  # Egypt — most numbers are local; override per tenant later


class WhatsAppError(Exception):
    """User-presentable WhatsApp failure (no number found, etc.)."""


def normalize_phone(raw: str, default_cc: str = DEFAULT_CC) -> Optional[str]:
    """Any phone format → bare international digits (e.g. 201001234567)."""
    digits = re.sub(r"\D", "", raw or "")
    if not digits:
        return None
    if digits.startswith("00"):
        digits = digits[2:]
    elif digits.startswith("0"):
        digits = default_cc + digits[1:]
    elif len(digits) <= 10 and not digits.startswith(default_cc):
        # bare local number without leading 0
        digits = default_cc + digits
    return digits if len(digits) >= 10 else None


def _looks_like_number(text: str) -> bool:
    return len(re.sub(r"\D", "", text or "")) >= 7


def resolve_recipient(db: Session, tenant_id: str, who: str) -> dict:
    """
    Figure out who to message. `who` may be a phone number or a lead name.
    Returns {phone, name, lead_id, found}. Raises WhatsAppError if unresolved.
    """
    who = (who or "").strip()
    if not who:
        raise WhatsAppError("قولي أبعت لمين")

    # Direct number
    if _looks_like_number(who):
        phone = normalize_phone(who)
        if not phone:
            raise WhatsAppError("الرقم مش مظبوط — قوله تاني")
        # match an existing lead by that phone for a nicer name
        lead = (
            db.query(Lead)
            .filter(Lead.tenant_id == tenant_id, Lead.phone.isnot(None))
            .all()
        )
        match = next((l for l in lead if normalize_phone(l.phone) == phone), None)
        return {"phone": phone, "name": match.name if match else None,
                "lead_id": match.id if match else None, "found": True}

    like = f"%{who}%"
    # 1) Saved WhatsApp contacts (the explicit address book) come first.
    contact = (
        db.query(WaContact)
        .filter(WaContact.tenant_id == tenant_id, WaContact.name.ilike(like))
        .order_by(WaContact.last_sent_at.desc().nullslast(), WaContact.created_at.desc())
        .first()
    )
    if contact:
        return {"phone": contact.phone, "name": contact.name,
                "lead_id": contact.lead_id, "found": True}

    # 2) Otherwise fall back to a matching lead.
    lead = (
        db.query(Lead)
        .filter(Lead.tenant_id == tenant_id, Lead.phone.isnot(None),
                or_(Lead.name.ilike(like)))
        .order_by(Lead.created_at.desc())
        .first()
    )
    if not lead:
        raise WhatsAppError(f"ملقتش رقم لـ «{who}» — اكتب اسمه ورقمه وهيتحفظ، أو قول الرقم")
    phone = normalize_phone(lead.phone)
    if not phone:
        raise WhatsAppError(f"رقم «{lead.name}» مش مظبوط في العملاء")
    return {"phone": phone, "name": lead.name, "lead_id": lead.id, "found": True}


def build_link(phone: str, text: str) -> str:
    return f"https://wa.me/{phone}?text={quote(text or '')}"


def build_desktop_uri(phone: str, text: str) -> str:
    """whatsapp:// opens the installed WhatsApp DESKTOP app with the chat +
    message pre-filled (not the browser). Client tries this first."""
    return f"whatsapp://send?phone={phone}&text={quote(text or '')}"


def _upsert_contact(db: Session, tenant_id: str, phone: str, name: Optional[str],
                    lead_id: Optional[str]) -> WaContact:
    contact = (
        db.query(WaContact)
        .filter(WaContact.tenant_id == tenant_id, WaContact.phone == phone)
        .first()
    )
    if not contact:
        contact = WaContact(tenant_id=tenant_id, phone=phone, name=name, lead_id=lead_id)
        db.add(contact)
    else:
        if name and not contact.name:
            contact.name = name
        if lead_id and not contact.lead_id:
            contact.lead_id = lead_id
    contact.last_sent_at = datetime.now(timezone.utc)
    return contact


def add_contact(db: Session, tenant_id: str, name: str, phone_raw: str) -> dict:
    """Save a WhatsApp contact (name + number) so it resolves by name later."""
    name = (name or "").strip()
    phone = normalize_phone(phone_raw)
    if not name:
        raise WhatsAppError("اكتب اسم العميل")
    if not phone:
        raise WhatsAppError("الرقم مش مظبوط")
    contact = _upsert_contact(db, tenant_id, phone, name, None)
    # _upsert_contact only fills an EMPTY name; for an explicit add, force it.
    contact.name = name
    db.commit()
    db.refresh(contact)
    return {"id": contact.id, "name": contact.name, "phone": contact.phone}


def list_contacts(db: Session, tenant_id: str) -> list:
    rows = (
        db.query(WaContact)
        .filter(WaContact.tenant_id == tenant_id)
        .order_by(WaContact.last_sent_at.desc().nullslast(), WaContact.created_at.desc())
        .all()
    )
    return [{"id": c.id, "name": c.name, "phone": c.phone,
             "last_sent_at": c.last_sent_at.isoformat() if c.last_sent_at else None}
            for c in rows]


def prepare_send(db: Session, tenant_id: str, who: str, text: str,
                 sent_by: str = "user") -> dict:
    """
    Resolve recipient + build the wa.me link + log the outbound message.
    The client opens `link` to actually send. Returns {link, phone, name, message}.
    """
    if not (text or "").strip():
        raise WhatsAppError("اكتب الرسالة الأول")
    r = resolve_recipient(db, tenant_id, who)
    link = build_link(r["phone"], text)
    desktop = build_desktop_uri(r["phone"], text)
    try:
        contact = _upsert_contact(db, tenant_id, r["phone"], r.get("name"), r.get("lead_id"))
        db.flush()
        db.add(WaMessage(tenant_id=tenant_id, contact_id=contact.id, direction="out",
                         body=text, sent_by=sent_by, method="link", status="sent"))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"WhatsApp log failed (send still works): {e}")
    return {"link": link, "desktop": desktop, "phone": r["phone"],
            "name": r.get("name"), "message": text}
