import calendar
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user
from app.models.lead import Lead
from app.models.deal import Deal, CRMActivity
from app.models.user import User
from app.schemas.deal import DEAL_STAGES

router = APIRouter()

ACTIVITY_ICONS = {
    "call": "call",
    "email": "mail",
    "meeting": "groups",
    "task": "task_alt",
    "note": "sticky_note_2",
}


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    All numbers for the dashboard in one round-trip:
    headline stats, 6-month revenue/lead series, pipeline distribution
    and the latest CRM activity feed.
    """
    tid = current_user.tenant_id
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── Headline stats ──────────────────────────────────────────────
    total_leads = db.query(func.count(Lead.id)).filter(Lead.tenant_id == tid).scalar() or 0
    leads_this_month = db.query(func.count(Lead.id)).filter(
        Lead.tenant_id == tid, Lead.created_at >= month_start
    ).scalar() or 0

    active_deals = db.query(func.count(Deal.id)).filter(
        Deal.tenant_id == tid, Deal.stage.notin_(["Won", "Lost"])
    ).scalar() or 0

    revenue_this_month = db.query(func.coalesce(func.sum(Deal.amount), 0)).filter(
        Deal.tenant_id == tid, Deal.stage == "Won", Deal.updated_at >= month_start
    ).scalar() or 0

    pending_tasks = db.query(func.count(CRMActivity.id)).filter(
        CRMActivity.tenant_id == tid, CRMActivity.status == "pending"
    ).scalar() or 0

    won_total = db.query(func.count(Deal.id)).filter(
        Deal.tenant_id == tid, Deal.stage == "Won"
    ).scalar() or 0
    conversion_rate = round((won_total / total_leads) * 100, 1) if total_leads else 0.0

    # ── 6-month revenue & leads series ──────────────────────────────
    series = []
    for i in range(5, -1, -1):
        m, y = month_start.month, month_start.year
        m -= i
        while m <= 0:
            m += 12
            y -= 1
        start = month_start.replace(year=y, month=m)
        end_m, end_y = (m + 1, y) if m < 12 else (1, y + 1)
        end = month_start.replace(year=end_y, month=end_m)

        revenue = db.query(func.coalesce(func.sum(Deal.amount), 0)).filter(
            Deal.tenant_id == tid, Deal.stage == "Won",
            Deal.updated_at >= start, Deal.updated_at < end,
        ).scalar() or 0
        lead_count = db.query(func.count(Lead.id)).filter(
            Lead.tenant_id == tid,
            Lead.created_at >= start, Lead.created_at < end,
        ).scalar() or 0
        series.append({
            "month": calendar.month_abbr[m],
            "revenue": float(revenue),
            "leads": lead_count,
        })

    # ── Pipeline distribution ───────────────────────────────────────
    rows = (
        db.query(Deal.stage, func.count(Deal.id))
        .filter(Deal.tenant_id == tid)
        .group_by(Deal.stage)
        .all()
    )
    stage_counts = {s: 0 for s in DEAL_STAGES}
    for stage, count in rows:
        stage_counts[stage] = count
    pipeline = [
        {"stage": s, "value": stage_counts[s]}
        for s in DEAL_STAGES if s != "Lost"
    ]

    # ── Recent activity feed ────────────────────────────────────────
    recent = (
        db.query(CRMActivity)
        .filter(CRMActivity.tenant_id == tid)
        .order_by(CRMActivity.created_at.desc())
        .limit(6)
        .all()
    )
    activity_feed = [
        {
            "icon": ACTIVITY_ICONS.get(a.type, "bolt"),
            "label": a.description or a.type,
            "time": a.created_at.isoformat() if a.created_at else None,
        }
        for a in recent
    ]

    return {
        "totals": {
            "leads": total_leads,
            "leads_this_month": leads_this_month,
            "active_deals": active_deals,
            "revenue_this_month": float(revenue_this_month),
            "pending_tasks": pending_tasks,
            "conversion_rate": conversion_rate,
        },
        "revenue_series": series,
        "pipeline": pipeline,
        "activity": activity_feed,
    }
