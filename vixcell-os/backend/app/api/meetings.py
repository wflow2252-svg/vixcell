"""
Meetings (AI) API — transcribe a meeting's audio (or pasted notes) into a
summary, decisions and action-item tasks.
"""
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User
from app.models.meeting import Meeting
from app.services import meeting_ai
from app.services.meeting_ai import MeetingError

logger = logging.getLogger(__name__)
router = APIRouter()
can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


class FromTextIn(BaseModel):
    transcript: str
    title: str = ""
    project_id: Optional[str] = None


@router.get("/")
def list_meetings(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_active_user)):
    return {"items": meeting_ai.list_meetings(db, current_user.tenant_id)}


@router.get("/{meeting_id}")
def get_meeting(meeting_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_active_user)):
    m = db.query(Meeting).filter(Meeting.id == meeting_id,
                                 Meeting.tenant_id == current_user.tenant_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return {
        "id": m.id, "title": m.title, "summary": m.summary, "transcript": m.transcript,
        "decisions": m.decisions or [], "action_items": m.action_items or [],
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.post("/from-text")
def from_text(body: FromTextIn, db: Session = Depends(get_db),
              current_user: User = Depends(can_write)):
    try:
        return meeting_ai.process_text(db, current_user.tenant_id, body.transcript,
                                       body.title, body.project_id)
    except MeetingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    title: str = Form(""),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(can_write),
):
    """Upload/record a meeting clip → transcript + summary + decisions + tasks."""
    suffix = Path(audio.filename or "clip.webm").suffix or ".webm"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name
        return meeting_ai.process_audio(db, current_user.tenant_id, tmp_path, title, project_id)
    except MeetingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Meeting transcribe failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="فشل معالجة الاجتماع")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
