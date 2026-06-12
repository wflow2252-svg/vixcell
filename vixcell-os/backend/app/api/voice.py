import logging
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.models.voice import VoiceLog
from app.services import voice_engine, tts_engine

logger = logging.getLogger(__name__)
router = APIRouter()

WHISPER_MISSING_MSG = "Speech engine not installed. Run: pip install faster-whisper"


class CommandIn(BaseModel):
    text: str
    use_llm_fallback: bool = True


class SpeakIn(BaseModel):
    text: str
    language: str = "ar"
    gender: str = "male"
    voice: str | None = None   # explicit Edge voice name overrides language/gender
    rate: str = "+8%"          # slightly brisk — snappier assistant feel


@router.get("/status")
def voice_status(current_user: User = Depends(get_current_active_user)):
    """Whisper/TTS availability + model storage location."""
    from app.core.config import settings
    return {
        "stt_available": voice_engine.whisper_available(),
        "tts_available": tts_engine.engine_available(),
        "default_voice": tts_engine.DEFAULT_VOICE_AR_MALE,
        "model_size": voice_engine.WHISPER_SIZE,
        "model_storage": str(Path(settings.MODEL_PATH) / "whisper"),
    }


@router.post("/speak")
def speak(body: SpeakIn, current_user: User = Depends(get_current_active_user)):
    """
    Text → MP3 with a neural male Egyptian voice (ar-EG-ShakirNeural).
    Disk-cached per phrase. 503 when edge-tts is missing or offline —
    the client then falls back to browser speech synthesis.
    """
    if not body.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="text is required")
    if not tts_engine.engine_available():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="TTS engine not installed. Run: pip install edge-tts")
    voice = body.voice or tts_engine.pick_voice(body.language, body.gender)
    try:
        audio = tts_engine.synthesize(body.text.strip(), voice=voice, rate=body.rate)
    except Exception as e:
        # Most common cause: no internet (edge-tts is a cloud service)
        logger.warning(f"TTS synthesis failed: {e}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"TTS failed: {e}")
    return Response(content=audio, media_type="audio/mpeg",
                    headers={"Cache-Control": "max-age=86400"})


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

    # Memory intents complete server-side: the client only has to speak the reply
    if intent["action"] == "remember" and intent["params"].get("content"):
        from app.models.memory import AssistantMemory
        try:
            db.add(AssistantMemory(tenant_id=current_user.tenant_id,
                                   content=intent["params"]["content"], source="voice"))
            db.commit()
            intent["speech"] = "تمام، حفظتها — هفضل فاكرها"
        except Exception:
            db.rollback()
            intent["speech"] = "معلش، معرفتش أحفظها — جرب تاني"

    elif intent["action"] == "recall_memory":
        from app.api.memory import recent_memory_texts
        facts = recent_memory_texts(db, current_user.tenant_id, limit=6)
        intent["speech"] = (
            "أنا فاكر إن: " + "؛ ".join(facts)
            if facts else "لسه معرفش حاجة عنك — قولي: افتكر إن... وأنا هحفظها"
        )

    # Still not a command? Answer conversationally instead of "didn't get it" —
    # the assistant should always respond with something useful.
    if intent["action"] == "unknown" and body.use_llm_fallback:
        from app.api.memory import recent_memory_texts
        facts = recent_memory_texts(db, current_user.tenant_id, limit=25)
        answer = voice_engine.llm_chat_answer(body.text, memories=facts)
        if answer:
            intent = {"action": "chat", "params": {}, "speech": answer}

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
