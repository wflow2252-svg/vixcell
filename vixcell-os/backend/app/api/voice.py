import logging
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.models.voice import VoiceLog
from app.services import voice_engine

logger = logging.getLogger(__name__)
router = APIRouter()

WHISPER_MISSING_MSG = "Speech engine not installed. Run: pip install faster-whisper"


class CommandIn(BaseModel):
    text: str
    use_llm_fallback: bool = True


@router.get("/status")
def voice_status(current_user: User = Depends(get_current_active_user)):
    """Whisper availability + model storage location."""
    from app.core.config import settings
    return {
        "stt_available": voice_engine.whisper_available(),
        "model_size": voice_engine.WHISPER_SIZE,
        "model_storage": str(Path(settings.MODEL_PATH) / "whisper"),
    }


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """
    Audio (webm/wav/mp3 from the mic) → text. Auto-detects Arabic/English.
    First call downloads the Whisper model to MODEL_PATH/whisper (~460 MB).
    """
    if not voice_engine.whisper_available():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=WHISPER_MISSING_MSG)

    suffix = Path(audio.filename or "clip.webm").suffix or ".webm"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name
        result = voice_engine.transcribe(tmp_path)
        return result
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Transcription failed: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/command")
def parse_command(
    body: CommandIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Transcript → structured intent. Rules first (instant); local-LLM
    fallback for free-form phrasing. Every command is logged.
    """
    intent = voice_engine.parse_intent(body.text)

    if intent["action"] == "unknown" and body.use_llm_fallback:
        llm_intent = voice_engine.llm_intent_fallback(body.text)
        if llm_intent:
            intent = llm_intent

    try:
        db.add(VoiceLog(
            tenant_id=current_user.tenant_id,
            direction="inbound",
            transcript=body.text,
            summary=intent["action"],
        ))
        db.commit()
    except Exception:
        db.rollback()  # logging must never break the command flow

    return intent
