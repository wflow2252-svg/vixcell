"""
Meeting Intelligence — turn a meeting's audio (or pasted notes) into a
transcript, a summary, decisions, and action items (which also become tasks).
Reuses the local Whisper (voice_engine) and Ollama (ai_engine) stacks.
"""
import json
import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.services import task_service

logger = logging.getLogger(__name__)


class MeetingError(Exception):
    """User-presentable meeting-processing failure."""


def _pick_model() -> Optional[str]:
    from app.services import ai_engine
    if not ai_engine.is_running():
        return None
    try:
        installed = {m["name"] for m in ai_engine.list_local_models()}
    except Exception:
        return None
    model = next((m for m in ai_engine.PREFERRED_MODELS if m in installed), None)
    if not model and installed:
        model = next((m for m in installed if "instruct" in m), next(iter(installed)))
    return model


def summarize(transcript: str) -> dict:
    """transcript → {summary, decisions[], action_items[]} via the local LLM."""
    from app.services import ai_engine
    transcript = (transcript or "").strip()
    if not transcript:
        return {"summary": "", "decisions": [], "action_items": []}
    model = _pick_model()
    if not model:
        return {"summary": "", "decisions": [], "action_items": []}

    system = (
        "انت بتلخّص اجتماع. رجّع JSON بس بالشكل: "
        '{"summary": "ملخص موجز بالعربي 3-5 جمل", '
        '"decisions": ["القرارات المتخذة"], '
        '"action_items": ["المهام المطلوبة، كل واحدة جملة قابلة للتنفيذ"]}. '
        "لو حاجة مش موجودة رجّعها قائمة فاضية. اكتب بنفس لغة الاجتماع."
    )
    # Cap transcript size fed to the model to keep it responsive on CPU.
    prompt = transcript[:8000]
    try:
        raw = ai_engine.chat(model=model, prompt=prompt, system=system,
                             temperature=0.3, max_tokens=900, timeout=180.0)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(m.group(0)) if m else {}
    except Exception as e:
        logger.warning(f"Meeting summarize failed: {e}")
        return {"summary": "", "decisions": [], "action_items": []}

    def _list(v):
        return [str(x).strip() for x in v if str(x).strip()] if isinstance(v, list) else []

    return {
        "summary": (data.get("summary") or "").strip(),
        "decisions": _list(data.get("decisions")),
        "action_items": _list(data.get("action_items")),
    }


def _persist(db: Session, tenant_id: str, title: str, transcript: str,
             result: dict, source: str, project_id: Optional[str],
             duration_sec: Optional[int]) -> dict:
    meeting = Meeting(
        tenant_id=tenant_id, title=title.strip() or "اجتماع",
        transcript=transcript, summary=result["summary"],
        decisions=result["decisions"], action_items=result["action_items"],
        source=source, project_id=project_id, duration_sec=duration_sec,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    created_tasks = []
    for item in result["action_items"][:20]:
        created_tasks.append(task_service.create_task(
            db, tenant_id, title=item, project_id=project_id, source="ai_meeting",
        ).id)

    return {
        "id": meeting.id, "title": meeting.title, "summary": meeting.summary,
        "decisions": meeting.decisions, "action_items": meeting.action_items,
        "transcript": meeting.transcript, "tasks_created": len(created_tasks),
        "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
    }


def process_text(db: Session, tenant_id: str, transcript: str, title: str = "",
                 project_id: Optional[str] = None) -> dict:
    if not (transcript or "").strip():
        raise MeetingError("الصق نص الاجتماع الأول")
    result = summarize(transcript)
    return _persist(db, tenant_id, title or "محضر اجتماع", transcript, result, "text", project_id, None)


def process_audio(db: Session, tenant_id: str, audio_path: str, title: str = "",
                  project_id: Optional[str] = None) -> dict:
    from app.services import voice_engine
    if not voice_engine.whisper_available():
        raise MeetingError("محرك التفريغ مش متثبت")
    if not voice_engine.model_ready():
        voice_engine.preload_model_async()
        raise MeetingError("لسه بجهّز محرك التفريغ — استنى نص دقيقة وجرب تاني")
    try:
        tr = voice_engine.transcribe(audio_path)
    except Exception as e:
        logger.error(f"Meeting transcription failed: {e}")
        raise MeetingError("فشل تفريغ الصوت")
    transcript = (tr.get("text") or "").strip()
    if not transcript:
        raise MeetingError("مسمعتش كلام واضح في التسجيل")
    result = summarize(transcript)
    return _persist(db, tenant_id, title or "اجتماع مسجّل", transcript, result,
                    "audio", project_id, int(tr.get("duration") or 0))


def list_meetings(db: Session, tenant_id: str) -> list:
    rows = (
        db.query(Meeting)
        .filter(Meeting.tenant_id == tenant_id)
        .order_by(Meeting.created_at.desc())
        .all()
    )
    return [{
        "id": m.id, "title": m.title, "summary": m.summary,
        "decisions": m.decisions or [], "action_items": m.action_items or [],
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in rows]
