"""
Website Client — bridges the desktop AI OS to the vixcell.com website.

Reads the per-tenant "vixcell_website" integration config (site URL +
API base) and exposes tasks/projects/meeting helpers. All failures raise
WebsiteError with an Arabic, user-presentable message.
"""
import logging
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.integration import IntegrationConfig

logger = logging.getLogger(__name__)

DEFAULT_SITE_URL = "https://vixcell.com"
PROVIDER = "vixcell_website"


class WebsiteError(Exception):
    """User-presentable website bridge failure."""


def get_config(db: Session, tenant_id: str) -> dict:
    row = (
        db.query(IntegrationConfig)
        .filter(IntegrationConfig.tenant_id == tenant_id,
                IntegrationConfig.provider == PROVIDER)
        .first()
    )
    cfg = dict(row.config or {}) if row and row.enabled else {}
    site = (cfg.get("site_url") or DEFAULT_SITE_URL).rstrip("/")
    api = (cfg.get("api_base") or f"{site}/api").rstrip("/")
    return {"site_url": site, "api_base": api, "configured": bool(row)}


def meeting_url(db: Session, tenant_id: str, role: str = "admin") -> str:
    cfg = get_config(db, tenant_id)
    return f"{cfg['site_url']}/meeting?role={role}"


def _get(api_base: str, path: str, params: Optional[dict] = None) -> dict:
    try:
        r = httpx.get(f"{api_base}{path}", params=params, timeout=20,
                      headers={"User-Agent": "VixcellAI-OS/1.0"})
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        logger.warning(f"Website API {path} -> {e.response.status_code}")
        raise WebsiteError(f"الموقع رد بخطأ ({e.response.status_code}) — اتأكد من عنوان الـ API في الإعدادات")
    except httpx.HTTPError as e:
        raise WebsiteError(f"مش قادر أوصل للموقع — اتأكد من الإنترنت ({e.__class__.__name__})")


def get_tasks(db: Session, tenant_id: str, status: Optional[str] = None, limit: int = 25) -> dict:
    cfg = get_config(db, tenant_id)
    params = {"limit": limit, "page": 1}
    if status:
        params["status"] = status
    data = _get(cfg["api_base"], "/tasks", params)
    tasks = data.get("tasks", data if isinstance(data, list) else [])
    return {"tasks": tasks, "total": data.get("total", len(tasks))}


def get_task_stats(db: Session, tenant_id: str) -> dict:
    cfg = get_config(db, tenant_id)
    return _get(cfg["api_base"], "/tasks/stats")


def get_projects(db: Session, tenant_id: str, limit: int = 25) -> dict:
    cfg = get_config(db, tenant_id)
    data = _get(cfg["api_base"], "/projects", {"limit": limit, "page": 1})
    projects = data.get("projects", data if isinstance(data, list) else [])
    return {"projects": projects, "total": data.get("total", len(projects))}


def update_task(db: Session, tenant_id: str, task_id: str, payload: dict) -> dict:
    cfg = get_config(db, tenant_id)
    try:
        r = httpx.put(f"{cfg['api_base']}/tasks/{task_id}", json=payload, timeout=20,
                      headers={"User-Agent": "VixcellAI-OS/1.0"})
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        raise WebsiteError(f"الموقع رفض التعديل ({e.response.status_code})")
    except httpx.HTTPError as e:
        raise WebsiteError(f"مش قادر أوصل للموقع ({e.__class__.__name__})")
