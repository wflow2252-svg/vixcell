"""
Task engine — native local tasks + AI task generation.
Spec: 'AI should generate tasks automatically from chats and meetings.'
Uses the local Ollama model to extract concrete action items from free text.
"""
import json
import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models.task import Task

logger = logging.getLogger(__name__)


def create_task(db: Session, tenant_id: str, title: str,
                description: Optional[str] = None, project_id: Optional[str] = None,
                priority: str = "medium", source: str = "manual") -> Task:
    task = Task(tenant_id=tenant_id, title=title.strip()[:500], description=description,
                project_id=project_id, priority=priority, source=source)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(db: Session, tenant_id: str, project_id: Optional[str] = None,
               status: Optional[str] = None) -> list:
    q = db.query(Task).filter(Task.tenant_id == tenant_id)
    if project_id:
        q = q.filter(Task.project_id == project_id)
    if status:
        q = q.filter(Task.status == status)
    rows = q.order_by(Task.created_at.desc()).all()
    return [_to_dict(t) for t in rows]


def _to_dict(t: Task) -> dict:
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "status": t.status, "priority": t.priority, "source": t.source,
        "project_id": t.project_id,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def update_task(db: Session, task: Task, **fields) -> Task:
    for k, v in fields.items():
        if v is not None and hasattr(task, k):
            setattr(task, k, v)
    db.commit()
    db.refresh(task)
    return task


def generate_from_text(db: Session, tenant_id: str, text: str,
                       project_id: Optional[str] = None,
                       source: str = "ai_chat") -> list:
    """
    Extract concrete action items from a chat/meeting/notes blob using the local
    LLM and persist them as tasks. Returns the created task dicts (possibly empty
    when no model is installed or nothing actionable was found).
    """
    from app.services import ai_engine
    text = (text or "").strip()
    if not text:
        return []

    model = _pick_model()
    if not model:
        logger.info("Task generation skipped: no local model installed")
        return []

    system = (
        "استخرج المهام والإجراءات المطلوبة من النص ده. "
        'رجّع JSON بس بالشكل: {"tasks": [{"title": "...", "priority": "low|medium|high"}]}. '
        "كل مهمة جملة قصيرة واضحة وقابلة للتنفيذ. لو مفيش مهام رجّع قائمة فاضية. "
        "اكتب عناوين المهام بنفس لغة النص."
    )
    try:
        raw = ai_engine.chat(model=model, prompt=text, system=system,
                             temperature=0.2, max_tokens=500, timeout=90.0)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(m.group(0)) if m else {"tasks": []}
        items = data.get("tasks", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.warning(f"Task generation failed: {e}")
        return []

    created = []
    for it in items[:20]:
        title = (it.get("title") or "").strip() if isinstance(it, dict) else str(it).strip()
        if not title:
            continue
        prio = (it.get("priority") if isinstance(it, dict) else "medium") or "medium"
        if prio not in ("low", "medium", "high"):
            prio = "medium"
        created.append(_to_dict(create_task(
            db, tenant_id, title=title, project_id=project_id,
            priority=prio, source=source,
        )))
    return created


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
