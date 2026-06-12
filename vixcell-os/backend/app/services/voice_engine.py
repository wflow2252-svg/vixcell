"""
Voice Engine — local speech-to-text via faster-whisper + intent parsing.

Whisper model weights are stored under settings.MODEL_PATH/whisper
(non-system drive). The model lazy-loads on first use and stays in memory.
Intent parsing is rule-based first (instant, deterministic for navigation
and common actions) with an optional local-LLM fallback for free-form
requests.
"""
import logging
import re
import threading
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None
_model_lock = threading.Lock()
_model_error: Optional[str] = None

WHISPER_SIZE = "small"  # good Arabic/English balance on modest hardware


def whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401
        return True
    except ImportError:
        return False


def get_model():
    """Lazy singleton — first call downloads weights to MODEL_PATH/whisper."""
    global _model, _model_error
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        import os
        from faster_whisper import WhisperModel
        download_root = str(Path(settings.MODEL_PATH) / "whisper")
        size = os.getenv("VIXCELL_WHISPER_MODEL", WHISPER_SIZE)
        # CPU int8 by default: CUDA needs system cuBLAS/cuDNN DLLs that most
        # machines lack, and the failure only surfaces at first encode.
        # Opt in to GPU with VIXCELL_WHISPER_DEVICE=cuda.
        device = os.getenv("VIXCELL_WHISPER_DEVICE", "cpu")
        compute = "float16" if device == "cuda" else "int8"
        try:
            _model = WhisperModel(size, device=device, compute_type=compute,
                                  download_root=download_root)
            logger.info(f"Whisper '{size}' loaded on {device} ({compute})")
        except Exception as e:
            _model_error = str(e)
            raise
    return _model


def preload_model_async() -> None:
    """
    Warms the Whisper model in a background thread at app startup so the
    first voice command doesn't pay the load (or first-run download) cost.
    """
    if not whisper_available():
        return

    def _warm():
        try:
            get_model()
        except Exception as e:
            logger.warning(f"Whisper preload failed (will retry on first use): {e}")

    threading.Thread(target=_warm, daemon=True, name="whisper-preload").start()


def transcribe(audio_path: str, language: Optional[str] = None) -> dict:
    """
    Transcribes an audio file (webm/wav/mp3 — decoded by PyAV, no ffmpeg
    binary needed). Auto-detects Arabic/English unless language is forced.
    """
    model = get_model()
    segments, info = model.transcribe(
        audio_path,
        language=language,          # None = auto-detect
        # Greedy decode: ~2-3x faster than beam 5 on CPU and accurate enough
        # for short push-to-talk commands.
        beam_size=1,
        vad_filter=True,            # trim silence — much faster on push-to-talk clips
        condition_on_previous_text=False,  # avoids repetition loops, slightly faster
    )
    text = " ".join(s.text.strip() for s in segments).strip()
    return {
        "text": text,
        "language": info.language,
        "language_probability": round(info.language_probability, 2),
        "duration": round(info.duration, 1),
    }


# ── Intent parsing ────────────────────────────────────────────────────────────

PAGE_ALIASES = {
    "/dashboard": ["لوحة التحكم", "الداشبورد", "الرئيسية", "dashboard", "home"],
    "/leads":     ["العملاء المحتملين", "العملاء المحتملون", "العملاء", "ليدز", "leads", "lead"],
    "/crm":       ["إدارة العلاقات", "الصفقات", "المبيعات", "سي ار ام", "crm", "deals", "pipeline"],
    "/social":    ["التواصل الاجتماعي", "السوشيال", "social"],
    "/content":   ["إنشاء المحتوى", "المحتوى", "content"],
    "/analytics": ["التحليلات", "التقارير", "analytics", "reports"],
    "/knowledge": ["قاعدة المعرفة", "المعرفة", "knowledge"],
    "/flows":     ["الأتمتة", "الفلوز", "flows", "automation"],
    "/ai-models": ["نماذج الذكاء", "النماذج", "الموديلات", "models", "ai models"],
    "/settings":  ["الإعدادات", "settings"],
}

NAV_TRIGGERS = ["روح", "افتح", "افتحلي", "اذهب", "وريني", "ورينى", "ورني", "خشني", "ادخل", "وديني", "خدني", "روحني", "open", "go to", "show", "navigate"]
STATS_TRIGGERS = ["إحصائيات", "الاحصائيات", "احصائيات", "الأرقام", "الارقام", "الملخص", "ملخص", "stats", "numbers", "summary", "أداء", "الاداء", "اداء", "الشغل ماشي ازاي", "ايه الاخبار", "ايه أخبار الشغل"]
LEAD_TRIGGERS = ["ضيف عميل", "أضف عميل", "اضف عميل", "ضيفلي عميل", "سجل عميل", "عميل جديد", "add lead", "new lead", "create lead"]
# "يجيب لي عملاء" — lead discovery from the local map data (no manual entry)
FIND_LEADS_TRIGGERS = [
    "جيب عملاء", "جبلي عملاء", "جيبلي عملاء", "هات عملاء", "هاتلي عملاء", "هات لي عملاء",
    "دور على عملاء", "دورلي على عملاء", "ابحث عن عملاء", "ابحثلي عن عملاء", "اجمع عملاء",
    "عايز عملاء", "عاوز عملاء", "محتاج عملاء", "اقتراحات عملاء",
    "find leads", "get leads", "find clients", "find customers", "discover leads",
]
SEARCH_LEAD_TRIGGERS = ["دور على عميل", "دورلي على عميل", "ابحث عن عميل", "فين عميل", "search lead", "find lead "]
EXPORT_TRIGGERS = ["صدر العملاء", "صدّر العملاء", "تصدير العملاء", "نزل العملاء", "نزلي العملاء", "طلع ملف العملاء", "export leads", "download leads"]
HELP_TRIGGERS = ["مساعدة", "ساعدني", "بتعرف تعمل ايه", "تعمل ايه", "تقدر تعمل ايه", "الاوامر", "اوامر", "ايه الاوامر", "help", "what can you do", "commands"]
STOP_TRIGGERS = ["اسكت", "اخرس", "كفاية", "بس كده", "خلاص", "وقف الكلام", "stop talking", "be quiet", "shut up"]
CONTENT_TRIGGERS = ["اكتب", "اكتبلي", "اعمل", "اعملي", "أنشئ", "انشئ", "جهز", "جهزلي", "write", "create", "generate"]
CONTENT_TYPES = {
    "facebook_post":     ["منشور فيس", "بوست فيس", "منشور", "بوست", "facebook", "post"],
    "instagram_caption": ["كابشن", "انستجرام", "انستقرام", "instagram", "caption"],
    "tiktok_script":     ["تيك توك", "تيكتوك", "سكريبت", "tiktok", "script"],
    "ad_copy":           ["إعلان", "اعلان", "ad", "advert"],
    "email":             ["ايميل", "إيميل", "بريد", "email", "mail"],
    "blog_article":      ["مقال", "مقالة", "بلوج", "blog", "article"],
}


def _normalize(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[أإآ]", "ا", text)
    text = re.sub(r"[ًٌٍَُِّْـ]", "", text)  # strip tashkeel/tatweel
    text = re.sub(r"\s+", " ", text)
    return text


# Normalize the alias/trigger tables once so hamza spelling variants
# (الإعدادات vs الاعدادات) always match the normalized transcript.
PAGE_ALIASES = {p: [_normalize(a) for a in al] for p, al in PAGE_ALIASES.items()}
CONTENT_TYPES = {k: [_normalize(a) for a in v] for k, v in CONTENT_TYPES.items()}
for _lst in (NAV_TRIGGERS, STATS_TRIGGERS, LEAD_TRIGGERS, FIND_LEADS_TRIGGERS,
             SEARCH_LEAD_TRIGGERS, EXPORT_TRIGGERS, HELP_TRIGGERS, STOP_TRIGGERS,
             CONTENT_TRIGGERS):
    _lst[:] = [_normalize(t) for t in _lst]


def parse_intent(text: str) -> dict:
    """
    Fast rule-based intent extraction. Returns:
    {action, params, confidence, speech} — speech is what the app should
    say back (Arabic, since the user speaks Arabic primarily).
    """
    norm = _normalize(text)
    if not norm:
        return {"action": "unknown", "params": {}, "speech": "لم أسمع شيئًا، حاول مرة أخرى"}

    # 0. Stop / help — instant control commands
    if any(t in norm for t in STOP_TRIGGERS) and len(norm.split()) <= 3:
        return {"action": "stop", "params": {}, "speech": None}
    if any(t in norm for t in HELP_TRIGGERS):
        return {
            "action": "help", "params": {},
            "speech": "أقدر أفتحلك أي صفحة، أقرالك الإحصائيات، أضيف عميل، أدورلك على عملاء جداد — "
                      "قول مثلًا: هاتلي عملاء مطاعم في القاهرة. وكمان أكتبلك منشور أو إعلان، وأصدّرلك العملاء في ملف.",
        }

    # 1. Stats / summary readout
    if any(t in norm for t in STATS_TRIGGERS):
        return {"action": "read_stats", "params": {}, "speech": None}

    # 1.5 Lead discovery — "هاتلي عملاء مطاعم في القاهرة"
    if any(t in norm for t in FIND_LEADS_TRIGGERS):
        params = {}
        m = re.search(r"(?:عملاء|leads|clients|customers)\s+(?:of\s+|for\s+)?(.+?)(?:\s+(?:في|فى|in)\s+(.+))?$", norm)
        if m:
            what = (m.group(1) or "").strip()
            where = (m.group(2) or "").strip()
            # strip dangling connectors picked up by the lazy group
            what = re.sub(r"^(جداد|جدد|new)\s*", "", what).strip()
            # "عملاء في القاهرة" (no type): the lazy group swallows "في <place>"
            if not where and what.startswith(("في ", "فى ")):
                where, what = what.split(" ", 1)[1].strip(), ""
            if what:
                params["what"] = what
            if where:
                params["where"] = where
        return {
            "action": "find_leads",
            "params": params,
            "speech": f"تمام، بدور لك على {params['what']}{' في ' + params['where'] if params.get('where') else ''} — ثواني"
                      if params.get("what") else None,
        }

    # 1.6 Export leads to CSV
    if any(t in norm for t in EXPORT_TRIGGERS):
        return {"action": "export_leads", "params": {}, "speech": "تمام، بجهزلك ملف العملاء"}

    # 1.7 Search for a specific lead
    if any(t in norm for t in SEARCH_LEAD_TRIGGERS):
        name_m = re.search(r"(?:عميل|lead)\s+(?:اسمه|اسمها|named|called)?\s*(.+)$", norm)
        q = name_m.group(1).strip() if name_m else ""
        return {"action": "search_leads", "params": {"query": q} if q else {}, "speech": None}

    # 2. Create lead — extract name/phone when present
    if any(t in norm for t in LEAD_TRIGGERS):
        params = {}
        name_m = re.search(r"(?:اسمه|اسمها|اسمو|يدعى|named?|called)\s+(.+?)(?:\s+(?:و?رقمه|و?رقمو|و?تليفونه|phone)|$)", norm)
        if name_m:
            params["name"] = name_m.group(1).strip()
        phone_m = re.search(r"(?:رقمه|رقمو|رقمها|تليفونه|تليفونو|phone(?:\s*number)?)\s*([\d\s+\-]{6,})", norm)
        if phone_m:
            params["phone"] = re.sub(r"\s", "", phone_m.group(1))
        return {
            "action": "create_lead",
            "params": params,
            "speech": f"تمام، هضيف العميل {params.get('name','الجديد')}" if params.get("name")
                      else "تمام، هفتحلك إضافة عميل جديد",
        }

    # 3. Generate content — detect type + topic
    if any(t in norm for t in CONTENT_TRIGGERS):
        ctype = None
        for k, aliases in CONTENT_TYPES.items():
            if any(a in norm for a in aliases):
                ctype = k
                break
        if ctype:
            topic_m = re.search(r"(?:عن|حول|about|on|بخصوص)\s+(.+)$", norm)
            topic = topic_m.group(1).strip() if topic_m else ""
            return {
                "action": "generate_content",
                "params": {"content_type": ctype, "topic": topic},
                "speech": "تمام، ببدأ أكتب المحتوى — ثواني" if topic else "افتحلك صفحة المحتوى، اكتب الموضوع",
            }

    # 4. Navigation (checked late so "افتح منشور..." hits content first)
    for path, aliases in PAGE_ALIASES.items():
        if any(a in norm for a in aliases):
            if any(t in norm for t in NAV_TRIGGERS) or len(norm.split()) <= 4:
                return {"action": "navigate", "params": {"path": path}, "speech": None}

    return {"action": "unknown", "params": {"text": text}, "speech": None}


def _pick_llm_model() -> Optional[str]:
    """Best installed local model for assistant tasks, or None."""
    from app.services import ai_engine
    if not ai_engine.is_running():
        return None
    try:
        installed = {m["name"] for m in ai_engine.list_local_models()}
    except Exception:
        return None
    model = next((m for m in ai_engine.PREFERRED_MODELS if m in installed), None)
    if not model and installed:
        # any installed model beats giving up — prefer instruct-tagged ones
        model = next((m for m in installed if "instruct" in m), next(iter(installed)))
    return model


def llm_intent_fallback(text: str) -> Optional[dict]:
    """
    Free-form commands → local LLM classification. Returns None when no
    model is available or parsing fails (caller keeps the 'unknown' intent).
    """
    from app.services import ai_engine
    import json
    model = _pick_llm_model()
    if not model:
        return None

    system = (
        "You convert voice commands (Arabic, Egyptian Arabic, or English) into JSON. "
        'Output ONLY JSON: {"action": "navigate|read_stats|create_lead|find_leads|export_leads|search_leads|generate_content|unknown", "params": {}}. '
        'navigate params: {"path": one of /dashboard /leads /crm /social /content /analytics /knowledge /flows /ai-models /settings}. '
        'create_lead params: {"name": "...", "phone": "..."} (only if mentioned). '
        'find_leads = user wants NEW potential clients found for them; params: {"what": business type, "where": city/area} (omit missing). '
        'search_leads params: {"query": "..."}. '
        'generate_content params: {"content_type": "facebook_post|instagram_caption|tiktok_script|ad_copy|email|blog_article", "topic": "..."}.'
    )
    try:
        raw = ai_engine.chat(model=model, prompt=text, system=system,
                             temperature=0.1, max_tokens=200)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            return None
        data = json.loads(m.group(0))
        if data.get("action") in {"navigate", "read_stats", "create_lead", "find_leads",
                                  "export_leads", "search_leads", "generate_content"}:
            data.setdefault("params", {})
            data["speech"] = None
            return data
    except Exception as e:
        logger.warning(f"LLM intent fallback failed: {e}")
    return None


def llm_chat_answer(text: str) -> Optional[str]:
    """
    Conversational fallback: when the transcript is not a command, answer
    it briefly in Egyptian Arabic so the assistant always responds usefully.
    Returns None when no local model is available.
    """
    from app.services import ai_engine
    model = _pick_llm_model()
    if not model:
        return None

    system = (
        "انت المساعد الصوتي بتاع Vixcell AI OS — نظام إدارة أعمال (عملاء، مبيعات، محتوى تسويقي). "
        "رد على المستخدم باللهجة المصرية، إجابة مفيدة ومختصرة جدًا (جملة لجملتين)، "
        "من غير مقدمات ولا تكرار للسؤال. لو طلب حاجة النظام مش بيعملها، اقترح أقرب حاجة بيعرف يعملها."
    )
    try:
        answer = ai_engine.chat(model=model, prompt=text, system=system,
                                temperature=0.4, max_tokens=160, timeout=60.0)
        answer = answer.strip()
        return answer or None
    except Exception as e:
        logger.warning(f"LLM chat fallback failed: {e}")
        return None
