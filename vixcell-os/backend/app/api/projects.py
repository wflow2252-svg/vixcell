"""
Projects API — delivery workspaces (auto-created from won deals or manual),
with assets (files/notes/links/meetings) and AI task generation.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User
from app.models.project import Project
from app.services import project_service, task_service

logger = logging.getLogger(__name__)
router = APIRouter()
can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


class ProjectIn(BaseModel):
    name: str
    description: Optional[str] = None
    deal_id: Optional[str] = None
    lead_id: Optional[str] = None


class AssetIn(BaseModel):
    kind: str = "note"            # file | note | link | meeting
    title: Optional[str] = None
    url: Optional[str] = None
    body: Optional[str] = None


class GenerateTasksIn(BaseModel):
    text: str                     # chat/meeting/notes to extract tasks from


@router.get("/")
def list_projects(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_active_user)):
    return {"items": project_service.list_projects(db, current_user.tenant_id)}


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectIn, db: Session = Depends(get_db),
                   current_user: User = Depends(can_write)):
    if not body.name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name is required")
    p = project_service.create_project(db, current_user.tenant_id, body.name,
                                       body.description, body.deal_id, body.lead_id)
    return {"id": p.id, "name": p.name}


def _get_project(db: Session, tenant_id: str, project_id: str) -> Project:
    p = db.query(Project).filter(Project.id == project_id,
                                 Project.tenant_id == tenant_id).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return p


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_active_user)):
    p = _get_project(db, current_user.tenant_id, project_id)
    return {
        "id": p.id, "name": p.name, "description": p.description, "status": p.status,
        "deal_id": p.deal_id, "lead_id": p.lead_id,
        "assets": [{"id": a.id, "kind": a.kind, "title": a.title, "url": a.url,
                    "body": a.body} for a in p.assets],
        "tasks": task_service.list_tasks(db, current_user.tenant_id, project_id=p.id),
    }


@router.put("/{project_id}")
def update_project(project_id: str, body: ProjectIn, db: Session = Depends(get_db),
                   current_user: User = Depends(can_write)):
    p = _get_project(db, current_user.tenant_id, project_id)
    p.name = body.name.strip() or p.name
    if body.description is not None:
        p.description = body.description
    db.commit()
    return {"id": p.id, "name": p.name}


@router.post("/{project_id}/assets", status_code=status.HTTP_201_CREATED)
def add_asset(project_id: str, body: AssetIn, db: Session = Depends(get_db),
              current_user: User = Depends(can_write)):
    p = _get_project(db, current_user.tenant_id, project_id)
    a = project_service.add_asset(db, p, body.kind, body.title, body.url, body.body)
    return {"id": a.id}


@router.post("/{project_id}/generate-tasks")
def generate_tasks(project_id: str, body: GenerateTasksIn, db: Session = Depends(get_db),
                   current_user: User = Depends(can_write)):
    p = _get_project(db, current_user.tenant_id, project_id)
    created = task_service.generate_from_text(db, current_user.tenant_id, body.text,
                                              project_id=p.id, source="ai_chat")
    return {"created": created, "count": len(created)}
