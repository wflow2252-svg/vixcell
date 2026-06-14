"""
Automation API — run a natural-language goal as a multi-step agent over the
local, non-destructive toolset.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, RoleChecker
from app.models.user import User
from app.services import agent_runner
from app.services.agent_runner import AgentError

logger = logging.getLogger(__name__)
router = APIRouter()
can_write = RoleChecker(allowed_roles=["admin", "manager", "sales"])


class RunIn(BaseModel):
    goal: str


class RunStepsIn(BaseModel):
    goal: str
    steps: list = []


@router.get("/tools")
def list_tools(current_user: User = Depends(can_write)):
    """The capabilities the agent can chain."""
    return {"tools": agent_runner.TOOLS}


@router.post("/run")
def run_agent(body: RunIn, db: Session = Depends(get_db),
              current_user: User = Depends(can_write)):
    if not body.goal.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="اكتب الهدف")
    try:
        return agent_runner.run(db, current_user.tenant_id, body.goal.strip())
    except AgentError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Agent run failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="حصلت مشكلة في تنفيذ الأتمتة")


# ── Cowork: plan first (review) → then execute the approved plan ──
@router.post("/plan")
def plan_agent(body: RunIn, current_user: User = Depends(can_write)):
    """Goal → an ordered plan of steps, WITHOUT executing anything."""
    if not body.goal.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="اكتب الهدف")
    try:
        steps = agent_runner.plan(body.goal.strip())
        return {"goal": body.goal.strip(), "steps": steps,
                "message": "دي الخطة — راجعها واضغط نفّذ" if steps else "مفيش خطوات للهدف ده"}
    except AgentError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Agent plan failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="حصلت مشكلة في التخطيط")


@router.post("/run-steps")
def run_steps_agent(body: RunStepsIn, db: Session = Depends(get_db),
                    current_user: User = Depends(can_write)):
    """Execute an already-reviewed plan."""
    try:
        return agent_runner.run_steps(db, current_user.tenant_id, body.goal.strip(), body.steps)
    except AgentError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Agent run-steps failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="حصلت مشكلة في التنفيذ")
