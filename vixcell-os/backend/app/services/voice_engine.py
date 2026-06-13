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
_model_loading = False
_loaded_size: Optional[str] = None


def model_ready() -> bool:
    return _model is not None


def model_loading() -> bool:
    return _model_loading

# User asked for high accuracy. 'medium' is the practical high on this CPU —
# clearly better Egyptian Arabic than small; the startup preload + the /transcribe
# loading-503 guard keep it from ever hanging the user. large-v3 is selectable
# in Settings for max accuracy (slower).
WHISPER_SIZE = "medium"
ALLOWED_WHISPER_MODELS = ["tiny", "base", "small", "medium", "large-v3", "large-v3-turbo"]

# Domain vocabulary the recognizer should be biased towards (mixed ar/en —
# brand names and app terms Whisper otherwise mangles).
HOTWORDS = (
    "Vixcell فيكسيل ميتنج تاسك تاسكات ليدز Claude Code كلود كود "
    "واتساب فيسبوك انستجرام CRM داشبورد"
)


def whisper_available() -> bool:
    try:
        import faster_whisper  # noqa: F401
        return True
    except ImportError:
        return False


def configured_model_size() -> str:
    """env override > saved settings.json WHISPER_MODEL > default."""
    import os
    env = os.getenv("VIXCELL_WHISPER_MODEL")
    if env:
        return env
    try:
        import json
        app_data = Path(os.getenv("APPDATA", os.path.expanduser("~\\AppData\\Roaming")))
        cfg_file = app_data / "VixcellAI" / "settings.json"
        if cfg_file.exists():
            with open(cfg_file, "r", encoding="utf-8-sig") as f:
                saved = json.load(f).get("WHISPER_MODEL")
            if saved in ALLOWED_WHISPER_MODELS:
                return saved
    except Exception as e:
        logger.warning(f"Could not read WHISPER_MODEL from settings.json: {e}")
    return WHISPER_SIZE


def get_model():
    """Lazy singleton — first call downloads weights to MODEL_PATH/whisper."""
    global _model, _model_error, _model_loading, _loaded_size
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        import os
        from faster_whisper import WhisperModel
        download_root = str(Path(settings.MODEL_PATH) / "whisper")
        size = configured_model_size()
        # CPU int8 by default: CUDA needs system cuBLAS/cuDNN DLLs that most
        # machines lack, and the failure only surfaces at first encode.
        # Opt in to GPU with VIXCELL_WHISPER_DEVICE=cuda.
        device = os.getenv("VIXCELL_WHISPER_DEVICE", "cpu")
        compute = "float16" if device == "cuda" else "int8"
        _model_loading = True
        try:
            _model = WhisperModel(size, device=device, compute_type=compute,
                                  download_root=download_root)
            _loaded_size = size
            logger.info(f"Whisper '{size}' loaded on {device} ({compute})")
        except Exception as e:
            _model_error = str(e)
            raise
        finally:
            _model_loading = False
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
    # Wide beam where it's cheap (small models), narrow where decode is the
    # bottleneck (medium/large picked in Settings) so commands stay snappy.
    beam = 5 if (_loaded_size or WHISPER_SIZE) in ("tiny", "base", "small") else 2

    def _run(lang):
        return model.transcribe(
            audio_path,
            language=lang,              # None = auto-detect
            beam_size=beam,
            vad_filter=True,            # trim silence — much faster on push-to-talk clips
            condition_on_previous_text=False,  # avoids repetition loops, slightly faster
            hotwords=HOTWORDS,          # bias brand/app vocabulary (ar + en)
        )

    segments, info = _run(language)
    # Short Egyptian clips sometimes mis-detect as Farsi/Urdu/etc. and come
    # out as garbage. The user only ever speaks Arabic or English — force a
    # re-run in Arabic when detection lands anywhere else.
    if language is None and info.language not in ("ar", "en"):
        logger.info(f"Re-running transcription: detected '{info.language}' → forcing ar")
        segments, info = _run("ar")

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
    "/projects":  ["المشاريع", "مشاريع", "المشروعات", "projects", "project"],
    "/social":    ["التواصل الاجتماعي", "السوشيال", "social"],
    "/content":   ["إنشاء المحتوى", "المحتوى", "content"],
    "/analytics": ["التحليلات", "التقارير", "analytics", "reports"],
    "/knowledge": ["قاعدة المعرفة", "المعرفة", "knowledge"],
    "/automation": ["الأتمتة", "الاوتوميشن", "الوكيل", "automation", "agent"],
    "/ai-models": ["نماذج الذكاء", "النماذج", "الموديلات", "models", "ai models"],
    "/training":  ["مركز التدريب", "التدريب", "training", "training center"],
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
MEETING_TRIGGERS = ["الميتنج", "ميتنج", "الاجتماع", "اجتماع", "غرفة الاجتماعات", "meeting"]
WHATSAPP_TRIGGERS = ["واتساب", "واتس اب", "واتس", "الواتس", "whatsapp", "whats app"]
# "ابعت/ابعتلي/كلم/راسل ..." — the send verbs
SEND_TRIGGERS = ["ابعت", "إبعت", "ابعتلي", "ابعتله", "ابعتلها", "كلم", "راسل", "رد على", "send", "message", "text"]
TASKS_TRIGGERS = ["التاسكات", "تاسكات", "التاسك", "تاسك", "المهام", "مهامي", "مهام الموقع", "الشغل المطلوب", "tasks", "my tasks", "todo"]
REMEMBER_TRIGGERS = ["افتكر", "احفظ ان", "احفظ معلومة", "خزن ان", "سجل ان", "اعرف ان", "remember that", "remember this", "note that"]
RECALL_TRIGGERS = ["عارف ايه عني", "فاكر ايه عني", "انت فاكر ايه", "تعرف ايه عني", "المعلومات اللي عندك عني", "what do you know about me", "what do you remember"]
SYSINFO_TRIGGERS = [
    "مواصفات", "مواصفات الجهاز", "الجهاز عامل ايه", "حالة الجهاز", "معلومات الجهاز",
    "جهازي", "اللابتوب", "الكمبيوتر", "الموارد", "system info", "specs", "device info", "pc info",
]
# Sub-topics → only answer what was asked
SYSINFO_TOPICS = {
    "ram": ["رام", "الرام", "الذاكرة", "ميموري", "ram", "memory"],
    "disk": ["مساحة", "المساحة", "الهارد", "القرص", "ديسك", "تخزين", "disk", "storage", "space"],
    "cpu": ["معالج", "المعالج", "بروسيسور", "السي بي يو", "cpu", "processor"],
    "battery": ["بطارية", "البطارية", "الشحن", "battery", "charge"],
    "gpu": ["كارت الشاشة", "كارت شاشة", "الجرافيك", "كروت", "gpu", "graphics", "vga"],
}
OPEN_APP_RE = re.compile(
    r"^(?:افتحلي|افتح لي|افتح|شغللي|شغل لي|شغل|ابدا|open|launch|run|start)\s+"
    r"(?:برنامج\s+|تطبيق\s+|app\s+)?(.+)$"
)
SEARCH_WEB_HINTS = ["جوجل", "قوقل", "النت", "الانترنت", "الويب", "google", "the web", "internet"]
VISION_TRIGGERS = [
    "حلل الشاشة", "حلل اللي قدامك", "حلل اللي قدامي", "بص على الشاشة", "بص الشاشة",
    "شوف الشاشة", "شوف اللي قدامك", "ايه اللي على الشاشة", "ايه اللي قدامي",
    "اللي على الشاشة", "اقرا الشاشة", "حلل الصورة", "تحليل الشاشة",
    "what's on my screen", "analyze my screen", "look at my screen", "read my screen",
]
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
SYSINFO_TOPICS = {k: [_normalize(a) for a in v] for k, v in SYSINFO_TOPICS.items()}
for _lst in (NAV_TRIGGERS, STATS_TRIGGERS, LEAD_TRIGGERS, FIND_LEADS_TRIGGERS,
             SEARCH_LEAD_TRIGGERS, EXPORT_TRIGGERS, HELP_TRIGGERS, STOP_TRIGGERS,
             CONTENT_TRIGGERS, MEETING_TRIGGERS, TASKS_TRIGGERS, REMEMBER_TRIGGERS,
             RECALL_TRIGGERS, SEARCH_WEB_HINTS, SYSINFO_TRIGGERS,
             WHATSAPP_TRIGGERS, SEND_TRIGGERS, VISION_TRIGGERS):
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

    # 0. Stop / memory / help — instant control commands
    if any(t in norm for t in STOP_TRIGGERS) and len(norm.split()) <= 3:
        return {"action": "stop", "params": {}, "speech": None}
    if any(t in norm for t in RECALL_TRIGGERS):
        return {"action": "recall_memory", "params": {}, "speech": None}
    if any(t in norm for t in REMEMBER_TRIGGERS):
        mem_m = re.search(
            r"(?:افتكر|احفظ|خزن|سجل|اعرف|remember|note)\s+(?:ان|انى|اني|معلومة|that|this)?\s*(.+)$", norm)
        content = mem_m.group(1).strip() if mem_m else ""
        return {
            "action": "remember",
            "params": {"content": content} if content else {},
            "speech": None if content else "قولي المعلومة اللي عايزني أفتكرها",
        }
    if any(t in norm for t in HELP_TRIGGERS):
        return {
            "action": "help", "params": {},
            "speech": "أقدر أفتحلك أي صفحة أو برنامج على الجهاز، أفتح الميتنج، أقرالك التاسكات والإحصائيات، "
                      "أدورلك على عملاء جداد، أكتبلك محتوى، وأفتكر معلومات تقولهالي. "
                      "وكمان أقولك حالة جهازك ومواصفاته. "
                      "جرب: افتحلي كلود كود، أو مواصفات الجهاز، أو كام رام فاضية، أو وريني التاسكات.",
        }

    # 0.5 Vision — "حلل اللي على الشاشة" / "بص على الشاشة"
    if any(t in norm for t in VISION_TRIGGERS):
        # carry any trailing question after the trigger
        qm = re.search(r"(?:الشاشة|قدامي|قدامك|screen)\s+(.+)$", norm)
        return {"action": "analyze_screen",
                "params": {"question": qm.group(1).strip() if qm else ""},
                "speech": "ثانية ببص على الشاشة"}

    # 1. Stats / summary readout
    if any(t in norm for t in STATS_TRIGGERS):
        return {"action": "read_stats", "params": {}, "speech": None}

    # 1.15 Machine info — "كام رام؟", "مواصفات الجهاز", "المساحة فاضية قد إيه؟"
    topic = next((k for k, aliases in SYSINFO_TOPICS.items() if any(a in norm for a in aliases)), None)
    asking = any(t in norm for t in SYSINFO_TRIGGERS) or topic is not None
    # Guard: a topic word alone (e.g. "المساحة") only counts as a question with
    # an asking verb or a short utterance — avoids hijacking unrelated phrases.
    if asking and (topic or any(t in norm for t in SYSINFO_TRIGGERS)):
        if topic and not any(t in norm for t in SYSINFO_TRIGGERS):
            q_words = ("كام", "قد ايه", "ايه", "فاضي", "فاضية", "حالة", "اقرا", "قولي", "عامل", "how", "what")
            if not (any(w in norm for w in q_words) or len(norm.split()) <= 4):
                topic = None
                asking = False
        if asking:
            return {"action": "system_info", "params": {"topic": topic or "overview"}, "speech": None}

    # 1.18 WhatsApp send — "ابعت لأحمد إن العرض خلص" / "كلم سارة وقولها ..." /
    #       "ابعت لأحمد منشور عن العروض" (topic → generate then send).
    if any(v in norm for v in SEND_TRIGGERS):
        m = re.search(
            r"(?:ابعتل\w*|ابعت\w*|كلم|راسل|رد على|send|message|text)\s+"
            r"(?:رساله\s+|رسالة\s+|على\s+الواتس\s+|فى\s+الواتس\s+|في\s+الواتس\s+|واتساب\s+|واتس\s+)?"
            r"(?:ل|لـ|الي|الى|إلى|to)?\s*"
            r"(.+?)\s+(عن|بخصوص|about|ان|انه|انها|اني|وقوله|وقولها|قوله|قولها|يقول|بكلمه|الرساله|بقوله|that|saying)\s+(.+)$",
            norm,
        )
        if m:
            recipient = m.group(1).strip()
            # strip trailing channel words and content nouns the recipient picked up
            recipient = re.sub(r"\s*(?:على\s+الواتس|فى\s+الواتس|في\s+الواتس|واتساب|واتس)\s*$", "", recipient).strip()
            recipient = re.sub(r"\s*(?:منشور|بوست|رساله|رسالة|ايميل|كلمتين|حاجه|كلمه|بوسته|رد)\s*$", "", recipient).strip()
            conn, rest = m.group(2), m.group(3).strip()
            if recipient:
                if conn in ("عن", "بخصوص", "about"):
                    return {"action": "send_whatsapp",
                            "params": {"to": recipient, "topic": rest}, "speech": None}
                return {"action": "send_whatsapp",
                        "params": {"to": recipient, "message": rest}, "speech": None}

    # 1.2 Meeting room (admin) — opened from the desktop app
    if any(t in norm for t in MEETING_TRIGGERS):
        return {"action": "open_meeting", "params": {},
                "speech": "تمام، بفتحلك غرفة الميتنج كأدمن"}

    # 1.3 Website tasks readout
    if any(t in norm for t in TASKS_TRIGGERS):
        return {"action": "read_tasks", "params": {}, "speech": None}

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

    # 5. Web search — needs both a search verb and an explicit web/Google hint
    if any(h in norm for h in SEARCH_WEB_HINTS) and \
       any(v in norm for v in ("دور", "ابحث", "سرش", "search", "google")):
        qm = re.search(r"(?:عن|على|for)\s+(.+)$", norm)
        query = qm.group(1).strip() if qm else ""
        query = re.sub(r"\s*(?:في|على|on)?\s*(?:جوجل|قوقل|النت|الانترنت|الويب|google|the web|internet)\s*$", "", query).strip()
        if query:
            return {"action": "search_web", "params": {"query": query},
                    "speech": f"بدور لك على {query} في جوجل"}

    # 6. Open an installed app / known website ("افتحلي كلود كود")
    # Last text rule: navigation above already claimed in-app page names.
    app_m = OPEN_APP_RE.match(norm)
    if app_m:
        target = app_m.group(1).strip()
        if target:
            return {"action": "open_app", "params": {"target": target}, "speech": None}

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
        'Output ONLY JSON: {"action": "navigate|read_stats|create_lead|find_leads|export_leads|search_leads|generate_content|open_app|search_web|open_meeting|read_tasks|remember|unknown", "params": {}}. '
        'navigate params: {"path": one of /dashboard /leads /crm /social /content /analytics /knowledge /flows /ai-models /settings}. '
        'create_lead params: {"name": "...", "phone": "..."} (only if mentioned). '
        'find_leads = user wants NEW potential clients found for them; params: {"what": business type, "where": city/area} (omit missing). '
        'search_leads params: {"query": "..."}. '
        'generate_content params: {"content_type": "facebook_post|instagram_caption|tiktok_script|ad_copy|email|blog_article", "topic": "..."}. '
        'open_app = open a program/website on the computer; params: {"target": app or site name}. '
        'search_web params: {"query": "..."}. '
        'open_meeting = open the video meeting room. '
        'read_tasks = show/read the work tasks. '
        'system_info = user asks about THIS machine (specs, ram, disk, cpu, battery, gpu); params: {"topic": "overview|ram|disk|cpu|battery|gpu"}. '
        'send_whatsapp = send a WhatsApp message; params: {"to": person name or number, "message": literal text} OR {"to": ..., "topic": subject to auto-write}. '
        'analyze_screen = user wants the assistant to look at / describe what is on the screen; params: {"question": optional}. '
        'remember = store a fact about the user; params: {"content": the fact}.'
    )
    try:
        raw = ai_engine.chat(model=model, prompt=text, system=system,
                             temperature=0.1, max_tokens=200)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            return None
        data = json.loads(m.group(0))
        if data.get("action") in {"navigate", "read_stats", "create_lead", "find_leads",
                                  "export_leads", "search_leads", "generate_content",
                                  "open_app", "search_web", "open_meeting", "read_tasks",
                                  "system_info", "send_whatsapp", "analyze_screen", "remember"}:
            data.setdefault("params", {})
            data["speech"] = None
            return data
    except Exception as e:
        logger.warning(f"LLM intent fallback failed: {e}")
    return None


def llm_chat_answer(text: str, memories: Optional[list] = None) -> Optional[str]:
    """
    Conversational fallback: when the transcript is not a command, answer
    it briefly in Egyptian Arabic so the assistant always responds usefully.
    `memories` = saved facts about the user, injected for personal answers.
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
    if memories:
        facts = "؛ ".join(m.strip() for m in memories[:25] if m and m.strip())
        if facts:
            system += f" معلومات محفوظة عن المستخدم استخدمها لو ليها علاقة: {facts}."
    try:
        answer = ai_engine.chat(model=model, prompt=text, system=system,
                                temperature=0.4, max_tokens=160, timeout=60.0)
        answer = answer.strip()
        return answer or None
    except Exception as e:
        logger.warning(f"LLM chat fallback failed: {e}")
        return None
