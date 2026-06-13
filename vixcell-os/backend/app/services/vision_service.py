"""
Vision — let the assistant SEE the screen and describe/analyse it.

Screen capture uses a tiny PowerShell (System.Drawing) snippet so there is no
extra Python dependency to bundle. The PNG is base64-encoded and sent to a
local vision model (llava) via Ollama. Falls back with a clear message when no
vision model is installed.
"""
import base64
import logging
import os
import subprocess
import tempfile

from app.services import ai_engine

logger = logging.getLogger(__name__)


class VisionError(Exception):
    """User-presentable vision failure."""


# Captures the primary screen to <out> as PNG via .NET — no pip deps.
_CAPTURE_PS = r"""
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bmp.Save('{out}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"""


def capture_screen_b64() -> str:
    """Grab the primary screen and return it base64-encoded (PNG)."""
    if os.name != "nt":
        raise VisionError("تصوير الشاشة متاح على ويندوز بس")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    tmp.close()
    try:
        script = _CAPTURE_PS.replace("{out}", tmp.name.replace("\\", "\\\\"))
        out = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            capture_output=True, timeout=25,
        )
        if not os.path.exists(tmp.name) or os.path.getsize(tmp.name) == 0:
            raise VisionError(f"تعذّر تصوير الشاشة: {out.stderr.decode('utf-8', 'replace')[:200]}")
        with open(tmp.name, "rb") as f:
            return base64.b64encode(f.read()).decode("ascii")
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


def analyze_screen(question: str = "") -> dict:
    """
    Capture the screen and have the local vision model describe/answer about it,
    in Egyptian Arabic. Returns {text, model}.
    """
    if not ai_engine.is_running():
        raise VisionError("محرك الذكاء مش شغّال — افتح صفحة نماذج الذكاء")
    model = ai_engine.installed_vision_model()
    if not model:
        raise VisionError("محتاج تنزّل نموذج رؤية الأول (مثلاً llava) من صفحة النماذج")

    img = capture_screen_b64()
    # llava is strong in English, weak in Arabic — describe in English first,
    # then render a natural Egyptian-Arabic answer with the text model (qwen).
    en_prompt = (
        "You are looking at a screenshot of the user's screen. Describe clearly "
        "what is open and the useful details (apps, windows, visible text). "
    )
    en_prompt += (f"Then specifically answer: {question}" if question.strip()
                  else "Tell the user what they are looking at right now.")
    try:
        english = ai_engine.vision(model, en_prompt, img)
    except Exception as e:
        logger.error(f"Vision analysis failed: {e}")
        raise VisionError("حصلت مشكلة في تحليل الشاشة — جرب تاني")
    if not english:
        return {"text": "مش قادر أوصف الشاشة دلوقتي", "model": model}

    # Translate/condense to Egyptian Arabic via the text model when available.
    txt_model = _pick_text_model()
    if txt_model:
        try:
            instr = ("لخّص الوصف ده في جملتين أو تلاتة بالعامية المصرية موجّهة "
                     "للمستخدم تبدأ بـ «انت فاتح» أو «على شاشتك». رد بالترجمة بس")
            if question.strip():
                instr += f"، وركّز على إجابة: {question}"
            ar = ai_engine.chat(model=txt_model, prompt=f"{instr}:\n\n{english}",
                                system=None, temperature=0.4, max_tokens=240,
                                timeout=90.0, repeat_penalty=1.4)
            if ar.strip() and not _looks_degenerate(ar):
                return {"text": ar.strip(), "model": f"{model}+{txt_model}"}
        except Exception as e:
            logger.warning(f"Vision AR translation failed, returning English: {e}")
    return {"text": english, "model": model}


def _looks_degenerate(text: str) -> bool:
    """True if the model fell into a repeated-token loop."""
    words = text.split()
    run = 1
    for i in range(1, len(words)):
        run = run + 1 if words[i] == words[i - 1] else 1
        if run >= 4:
            return True
    return False


def _pick_text_model():
    if not ai_engine.is_running():
        return None
    try:
        installed = {m["name"] for m in ai_engine.list_local_models()}
    except Exception:
        return None
    return next((m for m in ai_engine.PREFERRED_MODELS if m in installed), None)
