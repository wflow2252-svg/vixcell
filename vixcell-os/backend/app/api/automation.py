"""
Automation API — run a natural-language goal as a multi-step agent over the
local, non-destructive toolset.
"""
import base64
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, RoleChecker
from app.models.user import User
from app.services import agent_runner, ai_engine
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


@router.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...), question: str = Form(""),
                       current_user: User = Depends(can_write)):
    """Upload a file → AI analysis. Images via the local vision model (qwen2.5vl),
    text files via the local LLM."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="الملف فاضي")
    name = (file.filename or "").lower()
    ctype = (file.content_type or "")
    is_image = ctype.startswith("image/") or name.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"))

    if is_image:
        model = ai_engine.installed_vision_model()
        if not model:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail="محتاج نموذج رؤية (qwen2.5vl) متنزّل")
        b64 = base64.b64encode(data).decode()
        prompt = ((question.strip() or "حلّل الصورة دي بالتفصيل واستخرج أي نص فيها.") + " اكتب بالعربي.")
        try:
            text = ai_engine.vision(model, prompt, b64, temperature=0.2, timeout=240, max_tokens=700)
        except Exception as e:
            logger.warning(f"analyze-file image failed: {e}")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="فشل تحليل الصورة")
        return {"analysis": (text or "").strip(), "kind": "image", "name": file.filename}

    # Text-ish files
    text_content = data.decode("utf-8", errors="ignore")[:12000].strip()
    if not text_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="النوع ده مش مدعوم للتحليل (جرّب صورة أو ملف نصي)")
    model = agent_runner._pick_model()
    if not model:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="محرك الذكاء مش شغّال — افتح Ollama")
    q = question.strip() or "لخّص الملف ده واطلّع أهم النقاط."
    try:
        out = ai_engine.chat(model=model, prompt=f"{q}\n\nمحتوى الملف:\n{text_content}",
                             system="انت محلل مستندات. رد بالعربي المصري ومنظّم وباختصار.",
                             temperature=0.3, max_tokens=800, timeout=180.0, repeat_penalty=1.3)
    except Exception as e:
        logger.warning(f"analyze-file text failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="فشل تحليل الملف")
    return {"analysis": (out or "").strip(), "kind": "text", "name": file.filename}


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
