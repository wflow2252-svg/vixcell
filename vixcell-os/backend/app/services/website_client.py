"""
Website Client — bridges the desktop AI OS to the vixcell.com website's
*live* data, read directly from the same Supabase backend the public site
writes to.

Earlier this hit a REST API at vixcell.com/api/* that doesn't exist, so the
app always reported "الموقع مش مربوط". Now it reads the real Postgres tables
through Supabase's auto REST layer (PostgREST), exactly like the website does.

Zero-config: ships with the site's *publishable* (anon) Supabase URL + key —
those are designed to be public; what you can read is governed by the
database's Row-Level-Security, identical to the website. Both are overridable
per-tenant via the "vixcell_website" integration.

Anon-readable (public) tables → no setup:
  • site_projects  — the agency portfolio shown on vixcell.com
  • brand_config   — brand identity (logo, colors, name)
  • site_settings  — site-wide settings
Admin-only (RLS) tables → need a Supabase admin token in the integration:
  • submissions    — real client leads from the site's forms
"""
import logging
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.integration import IntegrationConfig

logger = logging.getLogger(__name__)

PROVIDER = "vixcell_website"
DEFAULT_SITE_URL = "https://vixcell.com"

# Publishable (anon) Supabase credentials for the vixcell.com project.
# Safe to embed — read access is enforced server-side by RLS, same as the site.
DEFAULT_SUPABASE_URL = "https://ilrxkhgdsirqppgqavjs.supabase.co"
DEFAULT_SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscnhraGdkc2lycXBwZ3FhdmpzIiwicm9sZSI6"
    "ImFub24iLCJpYXQiOjE3NzQ5OTQ3MjIsImV4cCI6MjA5MDU3MDcyMn0."
    "PcskF1v9PboxO3mdnmqq9p1mW0hsef1I32bUtFVp0f4"
)

# Human labels for the website's submission types
SUBMISSION_LABELS = {
    "project_intake": "طلب مشروع",
    "contact": "تواصل",
    "feedback": "رأي/تقييم",
}


class WebsiteError(Exception):
    """User-presentable website bridge failure (Arabic message)."""


def _cfg_row(db: Session, tenant_id: str) -> Optional[IntegrationConfig]:
    return (
        db.query(IntegrationConfig)
        .filter(IntegrationConfig.tenant_id == tenant_id,
                IntegrationConfig.provider == PROVIDER)
        .first()
    )


def get_config(db: Session, tenant_id: str) -> dict:
    """Resolved bridge config — built-in defaults unless the tenant overrode them."""
    row = _cfg_row(db, tenant_id)
    cfg = dict(row.config or {}) if row and row.enabled else {}
    site = (cfg.get("site_url") or DEFAULT_SITE_URL).rstrip("/")
    supa = (cfg.get("supabase_url") or DEFAULT_SUPABASE_URL).rstrip("/")
    key = cfg.get("supabase_key") or DEFAULT_SUPABASE_ANON_KEY
    # Optional Supabase admin JWT / service key — unlocks reading client leads.
    admin = (cfg.get("admin_token") or cfg.get("service_key") or "").strip()
    return {
        "site_url": site,
        "api_base": f"{site}/api",   # kept so older UI fields still resolve
        "supabase_url": supa,
        "supabase_key": key,
        "admin_token": admin,
        "configured": True,           # built-in defaults → always wired
    }


def _rest(cfg: dict, table: str, params: Optional[dict] = None, use_admin: bool = False) -> list:
    """GET a Supabase table via PostgREST. Returns a list of rows."""
    key = cfg["supabase_key"]
    bearer = cfg["admin_token"] if (use_admin and cfg["admin_token"]) else key
    url = f"{cfg['supabase_url']}/rest/v1/{table}"
    try:
        r = httpx.get(url, params=params or {}, timeout=20, headers={
            "apikey": key,
            "Authorization": f"Bearer {bearer}",
            "Accept": "application/json",
            "User-Agent": "VixcellAI-OS/1.0",
        })
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []
    except httpx.HTTPStatusError as e:
        logger.warning(f"Supabase {table} -> {e.response.status_code}: {e.response.text[:200]}")
        raise WebsiteError(f"الموقع رد بخطأ ({e.response.status_code}) — جرب تاني")
    except httpx.HTTPError as e:
        raise WebsiteError(f"مش قادر أوصل للموقع — اتأكد من الإنترنت ({e.__class__.__name__})")


def meeting_url(db: Session, tenant_id: str, role: str = "admin") -> str:
    cfg = get_config(db, tenant_id)
    return f"{cfg['site_url']}/meeting?role={role}"


# ── Portfolio projects (public) ───────────────────────────────────────────
def get_site_projects(db: Session, tenant_id: str, limit: int = 100) -> dict:
    cfg = get_config(db, tenant_id)
    rows = _rest(cfg, "site_projects", {
        "select": "id,title,client,industry,category,year,description,tags,image,url,featured,sort_order,created_at",
        "order": "sort_order.asc",
        "limit": limit,
    })
    return {"projects": rows, "total": len(rows)}


def get_brand(db: Session, tenant_id: str) -> dict:
    cfg = get_config(db, tenant_id)
    brand = _rest(cfg, "brand_config", {"select": "*", "limit": 1})
    settings = []
    try:
        settings = _rest(cfg, "site_settings", {"select": "*", "limit": 1})
    except WebsiteError:
        pass
    return {"brand": (brand[0] if brand else {}), "settings": (settings[0] if settings else {})}


# ── Client leads from the site forms (admin-only via RLS) ─────────────────
def get_submissions(db: Session, tenant_id: str, limit: int = 100) -> dict:
    cfg = get_config(db, tenant_id)
    try:
        rows = _rest(cfg, "submissions", {
            "select": "id,reference,type,name,whatsapp,email,brief,message,rating,source,read,created_at",
            "order": "created_at.desc",
            "limit": limit,
        }, use_admin=True)
        return {"items": rows, "total": len(rows), "needs_admin": False}
    except WebsiteError:
        # RLS returns an error/empty for anon reads of leads — surface that the
        # admin token is missing rather than failing the whole page.
        return {"items": [], "total": 0, "needs_admin": not bool(cfg["admin_token"])}


def connection_status(db: Session, tenant_id: str) -> dict:
    """Live proof the website is wired: counts of portfolio projects + leads."""
    cfg = get_config(db, tenant_id)
    out = {
        "site_url": cfg["site_url"],
        "api_base": cfg["api_base"],
        "supabase_url": cfg["supabase_url"],
        "connected": False,
        "projects": 0,
        "leads": None,         # None = couldn't read (admin needed)
        "needs_admin": not bool(cfg["admin_token"]),
        "has_admin": bool(cfg["admin_token"]),
        "error": None,
    }
    try:
        proj = get_site_projects(db, tenant_id, limit=1000)
        out["connected"] = True
        out["projects"] = proj["total"]
    except WebsiteError as e:
        out["error"] = str(e)
        return out
    subs = get_submissions(db, tenant_id, limit=1000)
    out["needs_admin"] = subs["needs_admin"]
    if not subs["needs_admin"]:
        out["leads"] = subs["total"]
    return out


def mark_submission_read(db: Session, tenant_id: str, sub_id: str, read: bool = True) -> dict:
    """Flip a website lead's read flag (needs admin token; best-effort)."""
    cfg = get_config(db, tenant_id)
    if not cfg["admin_token"]:
        return {"ok": False, "needs_admin": True}
    try:
        r = httpx.patch(
            f"{cfg['supabase_url']}/rest/v1/submissions",
            params={"id": f"eq.{sub_id}"},
            json={"read": read},
            timeout=20,
            headers={
                "apikey": cfg["supabase_key"],
                "Authorization": f"Bearer {cfg['admin_token']}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        r.raise_for_status()
        return {"ok": True}
    except httpx.HTTPError:
        return {"ok": False, "needs_admin": True}


# ── Back-compat shims for existing callers (TasksPage, voice "read_tasks") ──
def get_tasks(db: Session, tenant_id: str, status: Optional[str] = None, limit: int = 50) -> dict:
    """
    The "Website Tasks" view = incoming client requests to handle. Maps each
    site submission to a task-like row (unread = todo, read = done).
    """
    subs = get_submissions(db, tenant_id, limit=limit)
    tasks = []
    for s in subs["items"]:
        label = SUBMISSION_LABELS.get(s.get("type"), "طلب")
        contact = s.get("email") or s.get("whatsapp") or ""
        tasks.append({
            "id": s["id"],
            "title": f"{label} — {s.get('name') or 'عميل'}",
            "description": s.get("brief") or s.get("message") or "",
            "status": "done" if s.get("read") else "todo",
            "priority": "high" if s.get("type") == "project_intake" else "medium",
            "project": {"id": 0, "name": contact},
        })
    return {"tasks": tasks, "total": subs["total"], "needs_admin": subs.get("needs_admin")}


def get_task_stats(db: Session, tenant_id: str) -> dict:
    subs = get_submissions(db, tenant_id, limit=1000)
    open_n = sum(1 for s in subs["items"] if not s.get("read"))
    return {"total": subs["total"], "open": open_n, "needs_admin": subs.get("needs_admin")}


def get_projects(db: Session, tenant_id: str, limit: int = 100) -> dict:
    return get_site_projects(db, tenant_id, limit=limit)


def update_task(db: Session, tenant_id: str, task_id: str, payload: dict) -> dict:
    """Mark a website lead read/unread from the Tasks view (needs admin token)."""
    read = (payload or {}).get("status") == "done"
    return mark_submission_read(db, tenant_id, task_id, read=read)
