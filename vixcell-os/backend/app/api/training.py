"""
Training Center — the spec's "log everything → prepare fine-tuning datasets".
Surfaces the interaction log, basic stats, and exports a JSONL dataset locally.
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.core.config import settings
from app.models.user import User
from app.models.core import InteractionLog
from app.models.memory import AssistantMemory
from app.models.lead import Lead
from app.models.task import Task
from app.models.meeting import Meeting

logger = logging.getLogger(__name__)
router = APIRouter()
admin_only = RoleChecker(allowed_roles=["admin", "manager"])


@router.get("/stats")
def training_stats(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_active_user)):
    tid = current_user.tenant_id
    interactions = db.query(func.count(InteractionLog.id)).filter(InteractionLog.tenant_id == tid).scalar() or 0
    successful = db.query(func.count(InteractionLog.id)).filter(
        InteractionLog.tenant_id == tid, InteractionLog.success == True).scalar() or 0  # noqa: E712
    by_intent = dict(
        db.query(InteractionLog.intent, func.count(InteractionLog.id))
        .filter(InteractionLog.tenant_id == tid)
        .group_by(InteractionLog.intent).all()
    )
    return {
        "interactions": interactions,
        "successful": successful,
        "by_intent": {k or "unknown": v for k, v in by_intent.items()},
        "memories": db.query(func.count(AssistantMemory.id)).filter(AssistantMemory.tenant_id == tid).scalar() or 0,
        "leads": db.query(func.count(Lead.id)).filter(Lead.tenant_id == tid).scalar() or 0,
        "tasks": db.query(func.count(Task.id)).filter(Task.tenant_id == tid).scalar() or 0,
        "meetings": db.query(func.count(Meeting.id)).filter(Meeting.tenant_id == tid).scalar() or 0,
    }


@router.get("/interactions")
def list_interactions(limit: int = Query(50, ge=1, le=500),
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_active_user)):
    rows = (
        db.query(InteractionLog)
        .filter(InteractionLog.tenant_id == current_user.tenant_id)
        .order_by(InteractionLog.created_at.desc())
        .limit(limit).all()
    )
    return {"items": [{
        "id": r.id, "channel": r.channel, "input": r.input, "intent": r.intent,
        "result": r.result, "success": r.success,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]}


@router.post("/export")
def export_dataset(db: Session = Depends(get_db),
                   current_user: User = Depends(admin_only)):
    """
    Write the interaction log as a JSONL fine-tuning dataset to
    BACKUP_PATH/datasets. Each line: {instruction, input, output, intent}.
    """
    rows = (
        db.query(InteractionLog)
        .filter(InteractionLog.tenant_id == current_user.tenant_id)
        .order_by(InteractionLog.created_at).all()
    )
    out_dir = Path(settings.BACKUP_PATH) / "datasets"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = out_dir / f"interactions_{ts}.jsonl"
    n = 0
    try:
        with open(path, "w", encoding="utf-8") as f:
            for r in rows:
                if not r.input:
                    continue
                f.write(json.dumps({
                    "instruction": "نفّذ أمر المستخدم في نظام Vixcell",
                    "input": r.input,
                    "intent": r.intent,
                    "params": r.params or {},
                    "output": r.result or "",
                }, ensure_ascii=False) + "\n")
                n += 1
    except Exception as e:
        logger.error(f"Dataset export failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"فشل التصدير: {e}")
    return {"rows": n, "file": str(path)}
