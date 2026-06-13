"""
Native Tasks API — local AI-generatable tasks (distinct from website-bridge
tasks under /website/tasks).
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User
from app.models.task import Task
from app.services import task_service

logger = logging.getLogger(__name__)
router = APIRouter()
can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


class TaskIn(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    priority: str = "medium"


class TaskUpdateIn(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None       # todo | doing | done
    priority: Optional[str] = None
    description: Optional[str] = None


class GenerateIn(BaseModel):
    text: str
    project_id: Optional[str] = None


@router.get("/")
def list_tasks(project_id: Optional[str] = Query(None),
               status_filter: Optional[str] = Query(None, alias="status"),
               db: Session = Depends(get_db),
               current_user: User = Depends(get_current_active_user)):
    return {"items": task_service.list_tasks(db, current_user.tenant_id, project_id, status_filter)}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_task(body: TaskIn, db: Session = Depends(get_db),
                current_user: User = Depends(can_write)):
    if not body.title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title is required")
    t = task_service.create_task(db, current_user.tenant_id, body.title, body.description,
                                 body.project_id, body.priority, source="manual")
    return {"id": t.id}


@router.put("/{task_id}")
def update_task(task_id: str, body: TaskUpdateIn, db: Session = Depends(get_db),
                current_user: User = Depends(can_write)):
    t = db.query(Task).filter(Task.id == task_id, Task.tenant_id == current_user.tenant_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_service.update_task(db, t, **body.model_dump(exclude_unset=True))
    return {"id": t.id, "status": t.status}


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(can_write)):
    t = db.query(Task).filter(Task.id == task_id, Task.tenant_id == current_user.tenant_id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(t)
    db.commit()
    return None


@router.post("/generate")
def generate_tasks(body: GenerateIn, db: Session = Depends(get_db),
                   current_user: User = Depends(can_write)):
    """Extract action items from a chat/notes blob via the local LLM."""
    created = task_service.generate_from_text(db, current_user.tenant_id, body.text,
                                              project_id=body.project_id, source="ai_chat")
    return {"created": created, "count": len(created)}
