"""
Website bridge endpoints — tasks, projects and the admin meeting link
from vixcell.com, surfaced inside the desktop AI OS.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.services import website_client
from app.services.website_client import WebsiteError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
def website_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Where the bridge points (site + API base) and whether it's configured."""
    return website_client.get_config(db, current_user.tenant_id)


@router.get("/meeting")
def get_meeting_url(
    role: str = Query("admin"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Admin meeting room URL on the website — opened by the desktop app."""
    return {"url": website_client.meeting_url(db, current_user.tenant_id, role)}


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
