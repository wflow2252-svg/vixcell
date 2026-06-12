"""
System endpoints — the assistant's hands on the machine.
Local desktop app only (internal-key middleware + JWT gate every call).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel

from app.api.dependencies import get_current_active_user
from app.models.user import User
from app.services import system_control
from app.services.system_control import SystemControlError

logger = logging.getLogger(__name__)
router = APIRouter()


class OpenIn(BaseModel):
    kind: str            # app | url | folder | search
    target: str


@router.get("/apps")
def search_apps(
    q: str = Query("", description="Filter app names"),
    current_user: User = Depends(get_current_active_user),
):
    """Installed apps (Start Menu scan). Used for voice match debugging/UI."""
    apps = system_control.list_apps()
    names = sorted(apps.keys())
    if q:
        ql = q.lower()
        names = [n for n in names if ql in n]
    return {"count": len(names), "apps": names[:200]}


@router.post("/open")
def open_target(
    body: OpenIn,
    current_user: User = Depends(get_current_active_user),
):
    """
    Performs a system action: open an app / website / folder, or run a
    web search. The voice assistant calls this for "افتحلي ..." commands.
    """
    try:
        if body.kind == "app":
            return system_control.open_app(body.target)
        if body.kind == "url":
            return system_control.open_url(body.target)
        if body.kind == "folder":
            return system_control.open_folder(body.target)
        if body.kind == "search":
            return system_control.web_search(body.target)
    except SystemControlError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"System open failed ({body.kind}:{body.target}): {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="معرفتش أنفذ الأمر — جرب تاني")
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                        detail="kind must be app | url | folder | search")
