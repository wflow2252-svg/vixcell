import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.models.deal import Deal, CRMActivity
from app.models.lead import Lead
from app.models.user import User
from app.schemas.deal import (
    DealCreate, DealUpdate, DealOut, ActivityCreate, ActivityOut, DEAL_STAGES,
)

logger = logging.getLogger(__name__)
router = APIRouter()

can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


def deal_to_out(deal: Deal) -> DealOut:
    out = DealOut.model_validate(deal)
    out.lead_name = deal.lead.name if deal.lead else None
    out.assignee_name = deal.assignee.full_name if deal.assignee else None
    return out


@router.get("/deals", response_model=List[DealOut])
def list_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    stage: Optional[str] = Query(None),
):
    """
    Tenant-scoped deals, newest first, optionally filtered by stage.
    """
    q = (
        db.query(Deal)
        .options(joinedload(Deal.lead), joinedload(Deal.assignee))
        .filter(Deal.tenant_id == current_user.tenant_id)
    )
    if stage:
        q = q.filter(Deal.stage == stage)
    return [deal_to_out(d) for d in q.order_by(Deal.updated_at.desc()).all()]


@router.post("/deals", response_model=DealOut, status_code=status.HTTP_201_CREATED)
def create_deal(
    db: Session = Depends(get_db),
    deal_in: DealCreate = Body(...),
    current_user: User = Depends(can_write),
):
    if deal_in.stage not in DEAL_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid stage. Allowed: {DEAL_STAGES}",
        )
    # Validate linked lead belongs to the same tenant
    if deal_in.lead_id:
        lead = db.query(Lead).filter(
            Lead.id == deal_in.lead_id, Lead.tenant_id == current_user.tenant_id
        ).first()
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked lead not found")

    deal = Deal(tenant_id=current_user.tenant_id, **deal_in.model_dump(exclude_unset=True))
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal_to_out(deal)


@router.get("/pipeline")
def pipeline_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Deal counts and value per stage — feeds the kanban headers and dashboard pie.
    """
    rows = (
        db.query(Deal.stage, func.count(Deal.id), func.coalesce(func.sum(Deal.amount), 0))
        .filter(Deal.tenant_id == current_user.tenant_id)
        .group_by(Deal.stage)
        .all()
    )
    by_stage = {stage: {"count": 0, "value": 0.0} for stage in DEAL_STAGES}
    for stage, count, value in rows:
        by_stage[stage] = {"count": count, "value": float(value)}
    open_value = sum(
        v["value"] for s, v in by_stage.items() if s not in ("Won", "Lost")
    )
    return {
        "stages": DEAL_STAGES,
        "by_stage": by_stage,
        "open_value": open_value,
        "won_value": by_stage["Won"]["value"],
    }


@router.put("/deals/{deal_id}", response_model=DealOut)
def update_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    deal_in: DealUpdate = Body(...),
    current_user: User = Depends(can_write),
):
    deal = db.query(Deal).filter(
        Deal.id == deal_id, Deal.tenant_id == current_user.tenant_id
    ).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")

    update_data = deal_in.model_dump(exclude_unset=True)
    if "stage" in update_data and update_data["stage"] not in DEAL_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid stage. Allowed: {DEAL_STAGES}",
        )
    was_won = deal.stage == "Won"
    for field, value in update_data.items():
        setattr(deal, field, value)
    db.commit()
    db.refresh(deal)

    # Spec: when a deal is won, automatically spin up a delivery project.
    if deal.stage == "Won" and not was_won:
        try:
            from app.services import project_service
            project_service.create_from_deal(db, current_user.tenant_id, deal)
        except Exception as e:
            logger.warning(f"Auto-project on deal win failed: {e}")

    return deal_to_out(deal)


@router.post("/deals/{deal_id}/rescore")
def rescore_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_write),
):
    """AI re-estimates the closing probability for a deal (Deal Intelligence)."""
    deal = (
        db.query(Deal)
        .options(joinedload(Deal.lead))
        .filter(Deal.id == deal_id, Deal.tenant_id == current_user.tenant_id)
        .first()
    )
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    from app.services import deal_intel
    return deal_intel.rescore(db, deal)


@router.delete("/deals/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(can_write),
):
    deal = db.query(Deal).filter(
        Deal.id == deal_id, Deal.tenant_id == current_user.tenant_id
    ).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return None


# ── Activities ────────────────────────────────────────────────────────────────

@router.get("/activities", response_model=List[ActivityOut])
def list_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    deal_id: Optional[str] = Query(None),
    lead_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    q = db.query(CRMActivity).filter(CRMActivity.tenant_id == current_user.tenant_id)
    if deal_id:
        q = q.filter(CRMActivity.deal_id == deal_id)
    if lead_id:
        q = q.filter(CRMActivity.lead_id == lead_id)
    return q.order_by(CRMActivity.created_at.desc()).limit(limit).all()


@router.post("/activities", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity(
    db: Session = Depends(get_db),
    activity_in: ActivityCreate = Body(...),
    current_user: User = Depends(get_current_active_user),
):
    activity = CRMActivity(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        **activity_in.model_dump(exclude_unset=True),
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/activities/{activity_id}/complete", response_model=ActivityOut)
def complete_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    activity = db.query(CRMActivity).filter(
        CRMActivity.id == activity_id,
        CRMActivity.tenant_id == current_user.tenant_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    activity.status = "completed"
    db.commit()
    db.refresh(activity)
    return activity
