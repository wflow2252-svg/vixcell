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
    base = (
        "انت مساعد بيبص على لقطة شاشة لجهاز المستخدم. "
        "اوصف بإيجاز وباللهجة المصرية اللي ظاهر على الشاشة وأهم التفاصيل المفيدة. "
    )
    prompt = base + (f"وجاوب على السؤال ده تحديدًا: {question}" if question.strip()
                     else "قول للمستخدم هو شايف إيه دلوقتي.")
    try:
        text = ai_engine.vision(model, prompt, img)
    except Exception as e:
        logger.error(f"Vision analysis failed: {e}")
        raise VisionError("حصلت مشكلة في تحليل الشاشة — جرب تاني")
    return {"text": text or "مش قادر أوصف الشاشة دلوقتي", "model": model}
