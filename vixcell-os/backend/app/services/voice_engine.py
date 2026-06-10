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
        from faster_whisper import WhisperModel
        download_root = str(Path(settings.MODEL_PATH) / "whisper")
        size = settings.__dict__.get("WHISPER_MODEL") or WHISPER_SIZE
        try:
            # Try GPU first; fall back to CPU int8 (works everywhere)
            try:
                _model = WhisperModel(size, device="cuda", compute_type="float16",
                                      download_root=download_root)
                logger.info(f"Whisper '{size}' loaded on GPU")
            except Exception:
                _model = WhisperModel(size, device="cpu", compute_type="int8",
                                      download_root=download_root)
                logger.info(f"Whisper '{size}' loaded on CPU (int8)")
        except Exception as e:
            _model_error = str(e)
            raise
    return _model


def transcribe(audio_path: str, language: Optional[str] = None) -> dict:
    """
    Transcribes an audio file (webm/wav/mp3 — decoded by PyAV, no ffmpeg
    binary needed). Auto-detects Arabic/English unless language is forced.
    """
    model = get_model()
    segments, info = model.transcribe(
        audio_path,
        language=language,          # None = auto-detect
        beam_size=5,
        vad_filter=True,            # trim silence — much faster on push-to-talk clips
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

NAV_TRIGGERS = ["روح", "افتح", "اذهب", "وريني", "ورينى", "خشني", "ادخل", "open", "go to", "show", "navigate"]
STATS_TRIGGERS = ["إحصائيات", "الاحصائيات", "الأرقام", "الارقام", "الملخص", "ملخص", "stats", "numbers", "summary", "أداء", "الاداء"]
LEAD_TRIGGERS = ["ضيف عميل", "أضف عميل", "اضف عميل", "عميل جديد", "add lead", "new lead", "create lead"]
CONTENT_TRIGGERS = ["اكتب", "اعمل", "أنشئ", "انشئ", "جهز", "write", "create", "generate"]
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


def parse_intent(text: str) -> dict:
    """
    Fast rule-based intent extraction. Returns:
    {action, params, confidence, speech} — speech is what the app should
    say back (Arabic, since the user speaks Arabic primarily).
    """
    norm = _normalize(text)
    if not norm:
        return {"action": "unknown", "params": {}, "speech": "لم أسمع شيئًا، حاول مرة أخرى"}

    # 1. Stats / summary readout
    if any(t in norm for t in STATS_TRIGGERS):
        return {"action": "read_stats", "params": {}, "speech": None}

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


def llm_intent_fallback(text: str) -> Optional[dict]:
    """
    Free-form commands → local LLM classification. Returns None when no
    model is available or parsing fails (caller keeps the 'unknown' intent).
    """
    from app.services import ai_engine
    import json
    if not ai_engine.is_running():
        return None
    try:
        installed = {m["name"] for m in ai_engine.list_local_models()}
    except Exception:
        return None
    model = next((m for m in ai_engine.PREFERRED_MODELS if m in installed), None)
    if not model:
        return None

    system = (
        "You convert voice commands (Arabic or English) into JSON. "
        'Output ONLY JSON: {"action": "navigate|read_stats|create_lead|generate_content|unknown", "params": {}}. '
        'navigate params: {"path": one of /dashboard /leads /crm /social /content /analytics /knowledge /flows /ai-models /settings}. '
        'create_lead params: {"name": "...", "phone": "..."} (only if mentioned). '
        'generate_content params: {"content_type": "facebook_post|instagram_caption|tiktok_script|ad_copy|email|blog_article", "topic": "..."}.'
    )
    try:
        raw = ai_engine.chat(model=model, prompt=text, system=system,
                             temperature=0.1, max_tokens=200)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            return None
        data = json.loads(m.group(0))
        if data.get("action") in {"navigate", "read_stats", "create_lead", "generate_content"}:
            data.setdefault("params", {})
            data["speech"] = None
            return data
    except Exception as e:
        logger.warning(f"LLM intent fallback failed: {e}")
    return None
