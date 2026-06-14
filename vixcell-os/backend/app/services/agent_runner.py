"""
Automation Agent — turn a natural-language goal into an ordered plan of tool
calls and execute them. Reuses the proven, local, non-destructive skills
(open app/site/folder, web search, create lead/task/project, analyze screen)
instead of fragile screen-coordinate automation. Outward/risky actions are
intentionally NOT in the toolset.
"""
import json
import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Tools the agent is allowed to call (all local + non-destructive).
TOOLS = {
    "open_app":       'فتح برنامج على الجهاز. args: {"target": "اسم البرنامج"}',
    "open_url":       'فتح موقع. args: {"target": "اسم الموقع أو الرابط"}',
    "open_folder":    'فتح فولدر. args: {"target": "اسم الفولدر"}',
    "search_web":     'بحث في جوجل. args: {"query": "..."}',
    "create_task":    'إضافة مهمة. args: {"title": "..."}',
    "create_project": 'إنشاء مشروع. args: {"name": "..."}',
    "create_lead":    'إضافة عميل. args: {"name": "...", "phone": "اختياري"}',
    "analyze_screen": 'تصوير وتحليل الشاشة الحالية. args: {"question": "اختياري"}',
    "scroll":         'عمل سكورول في الشاشة. args: {"amount": رقم سالب لتحت موجب لفوق (مثلا -600)}',
    "press_key":      'كبس زرار أو اختصار. args: {"keys": "enter" أو "ctrl+s"}',
    "type_text":      'كتابة نص على الجهاز (في الحقل المفتوح). args: {"text": "..."}',
    "send_whatsapp":  'إرسال رسالة واتساب لعميل (بالاسم أو الرقم). args: {"to": "اسم أو رقم", "text": "الرسالة"}',
    "generate_content": 'كتابة محتوى/منشور بالذكاء. args: {"topic": "الموضوع", "content_type": "facebook_post اختياري"}',
    "wait":           'انتظار ثواني قبل الخطوة اللي بعدها. args: {"seconds": رقم}',
}


class AgentError(Exception):
    pass


def _pick_model() -> Optional[str]:
    from app.services import ai_engine
    if not ai_engine.is_running():
        return None
    try:
        installed = {m["name"] for m in ai_engine.list_local_models()}
    except Exception:
        return None
    model = next((m for m in ai_engine.PREFERRED_MODELS if m in installed), None)
    if not model and installed:
        model = next((m for m in installed if "instruct" in m), next(iter(installed)))
    return model


def plan(goal: str) -> list:
    """Goal → ordered [{tool, args}] via the local LLM."""
    from app.services import ai_engine
    model = _pick_model()
    if not model:
        raise AgentError("محرك الذكاء مش شغّال — افتح صفحة نماذج الذكاء")
    tool_lines = "\n".join(f'- {k}: {v}' for k, v in TOOLS.items())
    system = (
        "انت وكيل أتمتة. حوّل هدف المستخدم لخطوات منفّذة بالأدوات دي بس:\n"
        f"{tool_lines}\n"
        'رجّع JSON بس: {"steps": [{"tool": "...", "args": {...}}]}. '
        "بحد أقصى 6 خطوات، بالترتيب المنطقي. لو الهدف مش ينفّذ بالأدوات دي رجّع steps فاضية."
    )
    try:
        raw = ai_engine.chat(model=model, prompt=goal, system=system,
                             temperature=0.2, max_tokens=500, timeout=120.0,
                             repeat_penalty=1.3)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(m.group(0)) if m else {}
        steps = data.get("steps", []) if isinstance(data, dict) else []
    except Exception as e:
        logger.warning(f"Agent planning failed: {e}")
        raise AgentError("معرفتش أخطّط للهدف ده — جرب صيغة أوضح")
    return [s for s in steps if isinstance(s, dict) and s.get("tool") in TOOLS][:6]


def _run_step(db: Session, tenant_id: str, tool: str, args: dict) -> dict:
    from app.services import system_control, task_service, project_service, vision_service
    from app.models.lead import Lead
    args = args or {}
    if tool == "open_app":
        return system_control.open_app(args.get("target", ""))
    if tool == "open_url":
        return system_control.open_url(args.get("target", ""))
    if tool == "open_folder":
        return system_control.open_folder(args.get("target", ""))
    if tool == "search_web":
        return system_control.web_search(args.get("query", ""))
    if tool == "create_task":
        t = task_service.create_task(db, tenant_id, args.get("title", "مهمة"), source="ai_agent")
        return {"created_task": t.id, "title": t.title}
    if tool == "create_project":
        p = project_service.create_project(db, tenant_id, args.get("name", "مشروع"))
        return {"created_project": p.id, "name": p.name}
    if tool == "create_lead":
        lead = Lead(tenant_id=tenant_id, name=args.get("name", "عميل"),
                    phone=args.get("phone"), source="Agent", status="new")
        db.add(lead); db.commit(); db.refresh(lead)
        return {"created_lead": lead.id, "name": lead.name}
    if tool == "analyze_screen":
        return vision_service.analyze_screen(args.get("question", ""))
    if tool == "scroll":
        from app.services import computer_control
        return computer_control.scroll(int(args.get("amount", -600)))
    if tool == "press_key":
        from app.services import computer_control
        return computer_control.press(args.get("keys", "enter"))
    if tool == "type_text":
        from app.services import computer_control
        return computer_control.type_text(args.get("text", ""))
    if tool == "send_whatsapp":
        from app.services import whatsapp_service
        info = whatsapp_service.send_now(db, tenant_id, args.get("to", ""),
                                         args.get("text", ""), sent_by="ai")
        return {"sent_to": info.get("name") or info.get("phone"), "sent": info.get("sent")}
    if tool == "generate_content":
        from app.services import ai_engine
        mdl = _pick_model()
        if not mdl:
            return {"error": "محرك الذكاء مش شغّال"}
        txt = ai_engine.generate_content(mdl, args.get("content_type", "facebook_post"),
                                         args.get("topic", ""), language="ar-eg", tone="friendly") \
            if hasattr(ai_engine, "generate_content") else ai_engine.chat(
                model=mdl, prompt=args.get("topic", ""),
                system="اكتب منشور قصير احترافي بالعربي المصري.", temperature=0.7,
                max_tokens=400, repeat_penalty=1.3)
        return {"content": (txt or "").strip()[:1500]}
    if tool == "wait":
        import time as _t
        _t.sleep(min(float(args.get("seconds", 1)), 8))
        return {"waited": args.get("seconds", 1)}
    raise AgentError(f"أداة غير معروفة: {tool}")


def run(db: Session, tenant_id: str, goal: str) -> dict:
    """Plan + execute. Returns the goal, the steps and each step's outcome."""
    steps = plan(goal)
    if not steps:
        return {"goal": goal, "steps": [], "message": "مفيش خطوات ينفّذها الوكيل للهدف ده"}
    results = []
    for s in steps:
        tool, args = s.get("tool"), s.get("args") or {}
        entry = {"tool": tool, "args": args, "status": "done"}
        try:
            entry["result"] = _run_step(db, tenant_id, tool, args)
        except Exception as e:
            entry["status"] = "error"
            entry["result"] = {"error": str(e)}
        results.append(entry)
    ok = sum(1 for r in results if r["status"] == "done")
    return {"goal": goal, "steps": results, "message": f"نفّذت {ok} من {len(results)} خطوة"}


def run_steps(db: Session, tenant_id: str, goal: str, steps: list) -> dict:
    """Execute an already-approved plan (list of {tool, args}). Used by Cowork
    so the user reviews the plan before anything runs."""
    valid = [s for s in (steps or []) if isinstance(s, dict) and s.get("tool") in TOOLS]
    if not valid:
        return {"goal": goal, "steps": [], "message": "مفيش خطوات صالحة للتنفيذ"}
    results = []
    for s in valid:
        tool, args = s.get("tool"), s.get("args") or {}
        entry = {"tool": tool, "args": args, "status": "done"}
        try:
            entry["result"] = _run_step(db, tenant_id, tool, args)
            if isinstance(entry["result"], dict) and entry["result"].get("error"):
                entry["status"] = "error"
        except Exception as e:
            entry["status"] = "error"
            entry["result"] = {"error": str(e)}
        results.append(entry)
    ok = sum(1 for r in results if r["status"] == "done")
    return {"goal": goal, "steps": results, "message": f"نفّذت {ok} من {len(results)} خطوة"}
