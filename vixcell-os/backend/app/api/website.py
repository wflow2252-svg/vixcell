"""
Website bridge endpoints — live data from vixcell.com (read straight from its
Supabase backend) surfaced inside the desktop AI OS: the agency portfolio
(site_projects), brand identity, and client leads (submissions). Plus the
admin meeting link.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.user import User
from app.services import website_client, project_service
from app.services.website_client import WebsiteError

logger = logging.getLogger(__name__)
router = APIRouter()
can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


class ImportProjectIn(BaseModel):
    id: Optional[str] = None
    title: str
    client: Optional[str] = None
    industry: Optional[str] = None
    category: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None


@router.get("/status")
def website_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Live connection status: connected? + portfolio/lead counts."""
    return website_client.connection_status(db, current_user.tenant_id)


@router.get("/meeting")
def get_meeting_url(
    role: str = Query("admin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Admin meeting room URL on the website — opened by the desktop app."""
    return {"url": website_client.meeting_url(db, current_user.tenant_id, role)}


@router.get("/site-projects")
def website_site_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """The agency portfolio published on vixcell.com."""
    try:
        return website_client.get_site_projects(db, current_user.tenant_id)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.get("/brand")
def website_brand(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Brand identity + site settings from the website."""
    try:
        return website_client.get_brand(db, current_user.tenant_id)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.get("/submissions")
def website_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Real client leads submitted through the website forms (admin-only)."""
    try:
        return website_client.get_submissions(db, current_user.tenant_id)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/import-project", status_code=status.HTTP_201_CREATED)
def website_import_project(
    body: ImportProjectIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_write),
):
    """Bring a website portfolio project into the local delivery workspace."""
    if not body.title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title is required")
    bits = [b for b in [
        body.description,
        f"العميل: {body.client}" if body.client else None,
        f"المجال: {body.industry or body.category}" if (body.industry or body.category) else None,
        f"السنة: {body.year}" if body.year else None,
        f"الرابط: {body.url}" if body.url else None,
    ] if b]
    desc = "\n".join(bits) or None
    p = project_service.create_project(
        db, current_user.tenant_id, body.title.strip(), desc, None, None)
    return {"id": p.id, "name": p.name}


# ── Back-compat: "Website Tasks" view = incoming client requests ──────────
@router.get("/tasks")
def website_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return website_client.get_tasks(db, current_user.tenant_id, status=status_filter)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.get("/tasks/stats")
def website_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return website_client.get_task_stats(db, current_user.tenant_id)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.get("/projects")
def website_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return website_client.get_projects(db, current_user.tenant_id)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.put("/tasks/{task_id}")
def website_update_task(
    task_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        return website_client.update_task(db, current_user.tenant_id, task_id, payload)
    except WebsiteError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
