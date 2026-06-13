"""
Deal Intelligence — AI probability scoring + auto-project on win.
Writes only the existing `deals.probability` column (no schema change needed);
reasoning is returned to the caller and can be stored as a CRM note.
"""
import json
import logging
import re
from typing import Optional

from sqlalchemy.orm import Session

from app.models.deal import Deal

logger = logging.getLogger(__name__)


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


def rescore(db: Session, deal: Deal) -> dict:
    """
    Ask the local LLM to estimate closing probability (0-100) for a deal given
    its stage, value and lead. Persists to deal.probability. Returns
    {probability, reasoning} — reasoning is None when no model is available
    (probability then falls back to a stage heuristic).
    """
    stage_base = {"Discovery": 15, "Proposal": 40, "Negotiation": 65,
                  "Won": 100, "Lost": 0}
    model = _pick_model()
    lead_name = deal.lead.name if deal.lead else "غير محدد"

    if not model or deal.stage in ("Won", "Lost"):
        prob = stage_base.get(deal.stage, deal.probability or 0)
        deal.probability = prob
        db.commit()
        return {"probability": prob, "reasoning": None}

    system = (
        "انت محلل مبيعات. قدّر احتمالية إغلاق الصفقة من 0 لـ 100 بناءً على "
        "المرحلة والقيمة والعميل. رجّع JSON بس: "
        '{"probability": <0-100>, "reasoning": "سبب مختصر بالعربي"}.'
    )
    prompt = (f"العنوان: {deal.title}\nالمرحلة: {deal.stage}\n"
              f"القيمة: {float(deal.amount or 0)}\nالعميل: {lead_name}\n"
              f"الاحتمالية الحالية: {deal.probability}")
    try:
        from app.services import ai_engine
        raw = ai_engine.chat(model=model, prompt=prompt, system=system,
                             temperature=0.2, max_tokens=200, timeout=60.0)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(m.group(0)) if m else {}
        prob = int(data.get("probability", deal.probability or 0))
        prob = max(0, min(100, prob))
        deal.probability = prob
        db.commit()
        return {"probability": prob, "reasoning": data.get("reasoning")}
    except Exception as e:
        logger.warning(f"Deal rescore failed: {e}")
        prob = stage_base.get(deal.stage, deal.probability or 0)
        deal.probability = prob
        db.commit()
        return {"probability": prob, "reasoning": None}
