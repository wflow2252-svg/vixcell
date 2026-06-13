"""
Project engine — create/list projects and attach assets. A project is the
delivery workspace created (automatically or manually) from a won deal.
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.deal import Deal
from app.models.project import Project, ProjectAsset
from app.models.task import Task

logger = logging.getLogger(__name__)


def create_project(db: Session, tenant_id: str, name: str,
                   description: Optional[str] = None,
                   deal_id: Optional[str] = None,
                   lead_id: Optional[str] = None) -> Project:
    project = Project(tenant_id=tenant_id, name=name.strip(),
                      description=description, deal_id=deal_id, lead_id=lead_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def create_from_deal(db: Session, tenant_id: str, deal: Deal) -> Optional[Project]:
    """
    Auto-create a project for a won deal — once. Returns the existing project
    if one already points at this deal (idempotent, safe to call on every
    stage change).
    """
    existing = (
        db.query(Project)
        .filter(Project.tenant_id == tenant_id, Project.deal_id == deal.id)
        .first()
    )
    if existing:
        return existing
    name = deal.title or "مشروع جديد"
    project = create_project(
        db, tenant_id, name=name,
        description=f"أُنشئ تلقائيًا من صفقة مكسوبة بقيمة {float(deal.amount or 0):,.0f}",
        deal_id=deal.id, lead_id=deal.lead_id,
    )
    logger.info(f"Auto-created project {project.id} from won deal {deal.id}")
    return project


def list_projects(db: Session, tenant_id: str) -> list:
    rows = (
        db.query(Project)
        .filter(Project.tenant_id == tenant_id)
        .order_by(Project.created_at.desc())
        .all()
    )
    out = []
    for p in rows:
        open_tasks = sum(1 for t in p.tasks if t.status != "done")
        out.append({
            "id": p.id, "name": p.name, "status": p.status,
            "description": p.description, "deal_id": p.deal_id, "lead_id": p.lead_id,
            "task_count": len(p.tasks), "open_tasks": open_tasks,
            "asset_count": len(p.assets),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return out


def add_asset(db: Session, project: Project, kind: str, title: Optional[str],
              url: Optional[str], body: Optional[str]) -> ProjectAsset:
    asset = ProjectAsset(project_id=project.id, kind=kind, title=title, url=url, body=body)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
