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
