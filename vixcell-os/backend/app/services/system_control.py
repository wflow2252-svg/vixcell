"""
System Control — lets the assistant act on the whole machine:
open installed apps, websites, folders, and web searches by voice
("افتحلي كلود كود", "افتح يوتيوب", "دور على ...").

App discovery scans Start Menu shortcuts (.lnk) once and caches them.
Matching is fuzzy and understands common Arabic app names.
Windows-only by design (the desktop OS this app ships on).
"""
import difflib
import logging
import os
import re
import subprocess
import threading
import time
import webbrowser
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_apps_cache: Optional[dict] = None   # name_lower -> full path
_apps_cache_at: float = 0
_apps_lock = threading.Lock()
APPS_CACHE_TTL = 300  # seconds

START_MENU_DIRS = [
    Path(os.environ.get("PROGRAMDATA", r"C:\ProgramData")) / "Microsoft/Windows/Start Menu/Programs",
    Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Start Menu/Programs",
]

# Arabic / phonetic spoken names → canonical app search terms.
# Keys are normalized at module load (see _normalize_tables) so spelling
# variants (ة/ه، ى/ي، تشكيل) all match.
APP_ALIASES = {
    "كلود كود": "claude", "كلاود كود": "claude", "كلود": "claude", "كلاود": "claude",
    "claude code": "claude", "cloud code": "claude",
    "واتساب": "whatsapp", "واتس اب": "whatsapp", "الواتس": "whatsapp", "واتس": "whatsapp",
    "الواتساب": "whatsapp",
    "كروم": "chrome", "جوجل كروم": "chrome", "الكروم": "chrome",
    "المتصفح": "chrome", "متصفح": "chrome", "المستعرض": "chrome", "البراوزر": "chrome",
    "ايدج": "edge", "ميكروسوفت ايدج": "edge",
    "فايرفوكس": "firefox",
    "نوت باد": "notepad", "نوتباد": "notepad", "المفكرة": "notepad", "مفكرة": "notepad",
    "الاله الحاسبة": "calculator", "الالة الحاسبة": "calculator", "كالكوليتور": "calculator",
    "حاسبة": "calculator", "الحاسبة": "calculator", "الاله الحاسبه": "calculator",
    "الاعدادات": "settings", "اعدادات": "settings", "الضبط": "settings", "الاعدادت": "settings",
    "وورد": "word", "اكسل": "excel", "بوربوينت": "powerpoint", "باور بوينت": "powerpoint",
    "اوتلوك": "outlook", "الايميل": "outlook", "البريد": "outlook", "الميل": "outlook",
    "فوتوشوب": "photoshop", "اليستريتور": "illustrator",
    "في اس كود": "visual studio code", "فيجوال ستوديو كود": "visual studio code",
    "vs code": "visual studio code", "الكود": "visual studio code",
    "تيرمينال": "terminal", "التيرمينال": "terminal", "سي ام دي": "cmd",
    "باور شيل": "powershell",
    "سبوتيفاي": "spotify", "سبوتفاي": "spotify",
    "ديسكورد": "discord", "تيليجرام": "telegram", "تلجرام": "telegram", "تليجرام": "telegram",
    "زوم": "zoom",
    "بلندر": "blender",
    "اوبس": "obs", "او بي اس": "obs",
    "مستكشف الملفات": "explorer", "الملفات": "explorer", "اكسبلورر": "explorer",
    "الكاميرا": "camera", "كاميرا": "camera",
    "المتجر": "store", "ستور": "store",
    "الرسام": "paint", "بينت": "paint",
}

# Spoken site names → URLs (things people "open" that are websites, not apps)
SITE_MAP = {
    "يوتيوب": "https://www.youtube.com", "youtube": "https://www.youtube.com",
    "فيسبوك": "https://www.facebook.com", "فيس بوك": "https://www.facebook.com", "facebook": "https://www.facebook.com",
    "انستجرام": "https://www.instagram.com", "انستقرام": "https://www.instagram.com", "instagram": "https://www.instagram.com",
    "جيميل": "https://mail.google.com", "gmail": "https://mail.google.com",
    "جوجل": "https://www.google.com", "google": "https://www.google.com",
    "تويتر": "https://x.com", "اكس": "https://x.com", "twitter": "https://x.com",
    "لينكد ان": "https://www.linkedin.com", "لينكدان": "https://www.linkedin.com", "linkedin": "https://www.linkedin.com",
    "تيك توك": "https://www.tiktok.com", "tiktok": "https://www.tiktok.com",
    "جيت هاب": "https://github.com", "github": "https://github.com",
    "شات جي بي تي": "https://chatgpt.com", "chatgpt": "https://chatgpt.com",
    "الموقع بتاعنا": "https://vixcell.com", "موقعنا": "https://vixcell.com", "فيكسيل": "https://vixcell.com",
}

# Spoken folder names → shell paths
FOLDER_MAP = {
    "التنزيلات": "Downloads", "الداونلودز": "Downloads", "downloads": "Downloads",
    "المستندات": "Documents", "الدوكيومنتس": "Documents", "documents": "Documents",
    "الصور": "Pictures", "pictures": "Pictures",
    "سطح المكتب": "Desktop", "الديسكتوب": "Desktop", "desktop": "Desktop",
    "الفيديوهات": "Videos", "videos": "Videos",
}


class SystemControlError(Exception):
    """User-presentable failure (app not found, unsupported OS...)."""


def _scan_lnk_apps() -> dict:
    apps: dict[str, dict] = {}
    for root in START_MENU_DIRS:
        if not root.exists():
            continue
        try:
            for lnk in root.rglob("*.lnk"):
                name = lnk.stem.strip()
                # skip uninstallers and docs clutter
                if re.search(r"uninstall|read ?me|website|help", name, re.IGNORECASE):
                    continue
                apps.setdefault(name.lower(), {"type": "lnk", "target": str(lnk), "name": name})
        except OSError as e:
            logger.warning(f"Start Menu scan failed under {root}: {e}")
    return apps


def _scan_start_apps() -> dict:
    """
    Get-StartApps covers what .lnk scanning misses: UWP/MSIX apps
    (Claude, Notepad, Calculator, Terminal...). Launched later via
    explorer shell:AppsFolder\\<AppID> which works for win32 too.
    """
    import json
    import subprocess
    apps: dict[str, dict] = {}
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-StartApps | ConvertTo-Json -Compress"],
            capture_output=True, timeout=25,
        )
        data = json.loads(out.stdout.decode("utf-8", errors="replace") or "[]")
        if isinstance(data, dict):
            data = [data]
        for item in data:
            name = (item.get("Name") or "").strip()
            app_id = item.get("AppID")
            if name and app_id:
                apps.setdefault(name.lower(), {"type": "appid", "target": app_id, "name": name})
    except Exception as e:
        logger.warning(f"Get-StartApps scan failed (falling back to .lnk only): {e}")
    return apps


def _scan_apps() -> dict:
    # Get-StartApps first (broadest), .lnk entries override (direct launch)
    apps = _scan_start_apps()
    apps.update(_scan_lnk_apps())
    return apps


def list_apps(force_refresh: bool = False) -> dict:
    global _apps_cache, _apps_cache_at
    with _apps_lock:
        if force_refresh or _apps_cache is None or time.time() - _apps_cache_at > APPS_CACHE_TTL:
            _apps_cache = _scan_apps()
            _apps_cache_at = time.time()
        return dict(_apps_cache)


def _normalize(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[أإآ]", "ا", text)
    text = re.sub(r"[ًٌٍَُِّْـ]", "", text)   # tashkeel + tatweel
    text = text.replace("ة", "ه").replace("ى", "ي")  # spelling variants
    text = re.sub(r"\s+", " ", text)
    return text


# Normalize the lookup tables once so spoken spelling variants always match.
APP_ALIASES = {_normalize(k): v for k, v in APP_ALIASES.items()}
SITE_MAP = {_normalize(k): v for k, v in SITE_MAP.items()}
FOLDER_MAP = {_normalize(k): v for k, v in FOLDER_MAP.items()}


def match_app(query: str) -> Optional[tuple]:
    """Best (key, entry) for a spoken app name, else None."""
    q = _normalize(query)
    if not q:
        return None
    apps = list_apps()
    if not apps:
        return None

    # try as-spoken, then without the Arabic definite article ("الكروم")
    variants = [q]
    if q.startswith("ال") and len(q) > 3:
        variants.append(q[2:])
    for v in variants:
        v = APP_ALIASES.get(v, v)
        # exact, then substring, then fuzzy
        if v in apps:
            return v, apps[v]
        subs = [n for n in apps if v in n]
        if subs:
            best = min(subs, key=len)  # shortest containing name ≈ main entry
            return best, apps[best]
        close = difflib.get_close_matches(v, list(apps.keys()), n=1, cutoff=0.75)
        if close:
            return close[0], apps[close[0]]
    return None


def _launch(entry: dict) -> None:
    if entry["type"] == "lnk":
        os.startfile(entry["target"])  # noqa: S606 — user-initiated app launch
    else:
        # UWP/MSIX and Get-StartApps entries launch through the shell apps folder
        subprocess.Popen(["explorer.exe", f"shell:AppsFolder\\{entry['target']}"])


def open_app(query: str) -> dict:
    """Opens an installed app by spoken name. Falls back to known websites."""
    if os.name != "nt":
        raise SystemControlError("التحكم في البرامج متاح على ويندوز بس")
    hit = match_app(query)
    if hit:
        key, entry = hit
        _launch(entry)
        name = entry.get("name", key)
        logger.info(f"Opened app '{name}' for query '{query}'")
        return {"opened": name, "kind": "app"}

    nq = _normalize(query)
    url = SITE_MAP.get(nq)
    if url:
        webbrowser.open(url)
        return {"opened": url, "kind": "url"}

    # Maybe they meant a folder ("افتح التنزيلات")
    if nq in FOLDER_MAP or any(k in nq for k in FOLDER_MAP):
        try:
            return open_folder(query)
        except SystemControlError:
            pass

    # Last resort: a file/image by name in the common folders
    try:
        return open_file(query)
    except SystemControlError:
        pass

    raise SystemControlError(f"مش لاقي حاجة اسمها «{query}» على الجهاز — جرب اسم تاني")


def open_url(target: str) -> dict:
    t = (target or "").strip()
    url = SITE_MAP.get(_normalize(t))
    if not url:
        url = t if re.match(r"^https?://", t) else f"https://{t}" if "." in t and " " not in t else None
    if not url:
        raise SystemControlError(f"مش فاهم الرابط «{target}»")
    webbrowser.open(url)
    return {"opened": url, "kind": "url"}


def web_search(query: str) -> dict:
    from urllib.parse import quote_plus
    q = (query or "").strip()
    if not q:
        raise SystemControlError("قول عايز تدور على إيه")
    url = f"https://www.google.com/search?q={quote_plus(q)}"
    webbrowser.open(url)
    return {"opened": url, "kind": "search"}


def open_folder(target: str) -> dict:
    if os.name != "nt":
        raise SystemControlError("فتح الفولدرات متاح على ويندوز بس")
    t = _normalize(target)
    known = FOLDER_MAP.get(t)
    if known:
        path = Path.home() / known
    else:
        path = Path(target).expanduser()
    if not path.exists():
        raise SystemControlError(f"مش لاقي المكان «{target}»")
    os.startfile(str(path))  # noqa: S606
    return {"opened": str(path), "kind": "folder"}


# Where to look for files/images by spoken name (newest match wins).
_SEARCH_DIRS = ["Desktop", "Downloads", "Documents", "Pictures", "Videos", "Music"]
_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tif", ".tiff"}


def open_file(query: str, images_only: bool = False) -> dict:
    """
    Open a file/image by spoken name — searches the common user folders for a
    name match and opens the best (most recent) hit with its default app.
    """
    if os.name != "nt":
        raise SystemControlError("فتح الملفات متاح على ويندوز بس")
    q = _normalize(query)
    # drop filler words the user might say ("ملف", "صورة", "افتح")
    q = re.sub(r"\b(ملف|الملف|صوره|الصوره|صورة|افتح|ال)\b", " ", q).strip()
    if not q:
        raise SystemControlError("قول اسم الملف")
    home = Path.home()
    candidates = []
    for d in _SEARCH_DIRS:
        base = home / d
        if not base.exists():
            continue
        try:
            for p in base.rglob("*"):
                if not p.is_file():
                    continue
                if images_only and p.suffix.lower() not in _IMAGE_EXT:
                    continue
                if q in _normalize(p.stem):
                    candidates.append(p)
        except OSError:
            continue
    if not candidates:
        raise SystemControlError(f"ملقتش ملف اسمه «{query}» في الفولدرات المعتادة")
    # most-recently-modified match
    best = max(candidates, key=lambda p: p.stat().st_mtime)
    os.startfile(str(best))  # noqa: S606 — user-initiated open
    return {"opened": best.name, "path": str(best), "kind": "file"}
