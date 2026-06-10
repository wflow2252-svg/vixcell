import csv
import io
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadUpdate, LeadOut, LeadListOut

logger = logging.getLogger(__name__)
router = APIRouter()

can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


def compute_lead_score(lead: Lead) -> int:
    """
    Deterministic lead score (0-100) based on contactability,
    reputation signals and pipeline progress.
    """
    score = 0
    if lead.phone:
        score += 15
    if lead.email:
        score += 15
    if lead.website:
        score += 10
    if lead.social_links:
        score += min(len(lead.social_links) * 3, 9)
    if lead.rating is not None:
        score += round(float(lead.rating) / 5 * 20)
    if lead.review_count:
        score += min(round(lead.review_count / 10), 15)
    status_bonus = {"contacted": 5, "qualified": 16, "nurturing": 10}
    score += status_bonus.get(lead.status or "", 0)
    return min(score, 100)


def categorize(score: int) -> str:
    if score >= 70:
        return "Hot"
    if score >= 40:
        return "Warm"
    return "Cold"


@router.get("/", response_model=LeadListOut)
def list_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Search name/email/phone/address"),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
):
    """
    Paginated, tenant-scoped lead list with search and filters.
    """
    q = db.query(Lead).filter(Lead.tenant_id == current_user.tenant_id)

    if search:
        like = f"%{search}%"
        q = q.filter(or_(
            Lead.name.ilike(like),
            Lead.email.ilike(like),
            Lead.phone.ilike(like),
            Lead.address.ilike(like),
        ))
    if status_filter:
        q = q.filter(Lead.status == status_filter)
    if category:
        q = q.filter(Lead.category == category)
    if source:
        q = q.filter(Lead.source == source)

    total = q.count()
    items = (
        q.order_by(Lead.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return LeadListOut(items=items, total=total, page=page, page_size=page_size)


@router.post("/", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(
    db: Session = Depends(get_db),
    lead_in: LeadCreate = Body(...),
    current_user: User = Depends(can_write),
):
    """
    Create a lead in the current user's company. Score and category are computed server-side.
    """
    lead = Lead(tenant_id=current_user.tenant_id, **lead_in.model_dump(exclude_unset=True))
    lead.lead_score = compute_lead_score(lead)
    if not lead.category:
        lead.category = categorize(lead.lead_score)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/stats")
def lead_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Aggregate counts by status and category for the leads board header.
    """
    base = db.query(Lead).filter(Lead.tenant_id == current_user.tenant_id)
    total = base.count()
    by_status = dict(
        db.query(Lead.status, func.count(Lead.id))
        .filter(Lead.tenant_id == current_user.tenant_id)
        .group_by(Lead.status).all()
    )
    by_category = dict(
        db.query(Lead.category, func.count(Lead.id))
        .filter(Lead.tenant_id == current_user.tenant_id)
        .group_by(Lead.category).all()
    )
    avg_score = db.query(func.avg(Lead.lead_score)).filter(
        Lead.tenant_id == current_user.tenant_id
    ).scalar()
    return {
        "total": total,
        "by_status": by_status,
        "by_category": by_category,
        "avg_score": round(float(avg_score), 1) if avg_score is not None else 0,
    }


@router.get("/export/csv")
def export_leads_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Export all tenant leads as a UTF-8 (BOM) CSV that opens correctly in Excel, including Arabic text.
    """
    leads = (
        db.query(Lead)
        .filter(Lead.tenant_id == current_user.tenant_id)
        .order_by(Lead.created_at.desc())
        .all()
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "Name", "Phone", "Email", "Website", "Address", "Rating",
        "Reviews", "Score", "Category", "Status", "Source", "Notes", "Created",
    ])
    for l in leads:
        writer.writerow([
            l.name, l.phone or "", l.email or "", l.website or "", l.address or "",
            float(l.rating) if l.rating is not None else "", l.review_count or 0,
            l.lead_score, l.category or "", l.status or "", l.source or "",
            l.notes or "", l.created_at.isoformat() if l.created_at else "",
        ])
    # BOM so Excel detects UTF-8 (Arabic names)
    data = "﻿" + buf.getvalue()
    return StreamingResponse(
        iter([data]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=vixcell_leads.csv"},
    )


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    lead = db.query(Lead).filter(
        Lead.id == lead_id, Lead.tenant_id == current_user.tenant_id
    ).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    lead_in: LeadUpdate = Body(...),
    current_user: User = Depends(can_write),
):
    lead = db.query(Lead).filter(
        Lead.id == lead_id, Lead.tenant_id == current_user.tenant_id
    ).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    update_data = lead_in.model_dump(exclude_unset=True)
    explicit_category = "category" in update_data and update_data["category"]
    for field, value in update_data.items():
        setattr(lead, field, value)

    lead.lead_score = compute_lead_score(lead)
    if not explicit_category:
        lead.category = categorize(lead.lead_score)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_write),
):
    lead = db.query(Lead).filter(
        Lead.id == lead_id, Lead.tenant_id == current_user.tenant_id
    ).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return None
