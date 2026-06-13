"""
Text-to-Speech engine.

Prefers edge-tts (Microsoft neural Arabic voices) when online, and falls
back to the browser's SpeechSynthesis on the client when the engine is
unavailable. Keeps a per-clip disk cache so repeated phrases don't re-hit
the cloud.
"""
import asyncio
import hashlib
import logging
import os
import threading
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Default male Egyptian Arabic voice. User can override per request.
DEFAULT_VOICE_AR_MALE = "ar-EG-ShakirNeural"
DEFAULT_VOICE_AR_FEMALE = "ar-EG-SalmaNeural"
DEFAULT_VOICE_EN_MALE = "en-US-GuyNeural"
DEFAULT_VOICE_EN_FEMALE = "en-US-JennyNeural"

CACHE_ROOT = Path(settings.UPLOAD_PATH) / "tts"
CACHE_ROOT.mkdir(parents=True, exist_ok=True)

_voices_cache: Optional[list] = None
_voices_lock = threading.Lock()


def _strip_proxies() -> dict:
    saved = {k: os.environ.get(k) for k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy")}
    for k in saved:
        os.environ.pop(k, None)
    return saved


def _restore_proxies(saved: dict) -> None:
    for k, v in saved.items():
        if v is not None:
            os.environ[k] = v


def engine_available() -> bool:
    try:
        import edge_tts  # noqa: F401
        return True
    except ImportError:
        return False


def _cache_path(text: str, voice: str) -> Path:
    digest = hashlib.sha1(f"{voice}|{text}".encode("utf-8")).hexdigest()
    return CACHE_ROOT / f"{digest}.mp3"


async def _synthesize_async(text: str, voice: str, rate: str, pitch: str) -> bytes:
    import edge_tts
    comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    buf = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            buf.extend(chunk["data"])
    if not buf:
        raise RuntimeError("Edge TTS returned no audio")
    return bytes(buf)


def synthesize(text: str, voice: str = DEFAULT_VOICE_AR_MALE, rate: str = "+0%", pitch: str = "+0Hz") -> bytes:
    """Blocking synthesize with disk cache."""
    if not text or not text.strip():
        raise ValueError("text is required")
    if not engine_available():
        raise RuntimeError("edge-tts not installed")

    cache = _cache_path(text, voice)
    if cache.exists() and cache.stat().st_size > 0:
        return cache.read_bytes()

    saved = _strip_proxies()
    try:
        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            audio = loop.run_until_complete(_synthesize_async(text, voice, rate, pitch))
        finally:
            loop.close()
    finally:
        _restore_proxies(saved)

    cache.write_bytes(audio)
    return audio


async def list_voices() -> list:
    """List all Edge TTS voices. Cached for the process lifetime."""
    global _voices_cache
    if _voices_cache is not None:
        return _voices_cache
    with _voices_lock:
        if _voices_cache is not None:
            return _voices_cache
        if not engine_available():
            return []
        import edge_tts
        saved = _strip_proxies()
        try:
            voices = await edge_tts.list_voices()
            _voices_cache = [
                {
                    "name": v["ShortName"],
                    "gender": v.get("Gender"),
                    "locale": v.get("Locale"),
                    "friendly": v.get("FriendlyName"),
                }
                for v in voices
            ]
        finally:
            _restore_proxies(saved)
    return _voices_cache or []


def pick_voice(language: str = "ar", gender: str = "male") -> str:
    if language.startswith("en"):
        return DEFAULT_VOICE_EN_MALE if gender == "male" else DEFAULT_VOICE_EN_FEMALE
    return DEFAULT_VOICE_AR_MALE if gender == "male" else DEFAULT_VOICE_AR_FEMALE


# ── ElevenLabs (premium, human-grade) — optional, used when a key is set ──────
EL_DEFAULT_VOICE = "pNInz6obpgDQGcFmaJgB"   # "Adam" — multilingual, deep male
EL_MODEL = "eleven_multilingual_v2"          # supports Arabic


def elevenlabs_available(api_key: Optional[str]) -> bool:
    return bool(api_key and api_key.strip())


def synthesize_elevenlabs(text: str, api_key: str, voice_id: Optional[str] = None) -> bytes:
    """Human-grade TTS via ElevenLabs. Disk-cached per phrase+voice. Raises on failure."""
    import httpx
    if not text or not text.strip():
        raise ValueError("text is required")
    voice_id = (voice_id or EL_DEFAULT_VOICE).strip()
    cache = _cache_path(text, f"el:{voice_id}|{EL_MODEL}")
    if cache.exists() and cache.stat().st_size > 0:
        return cache.read_bytes()

    saved = _strip_proxies()
    try:
        r = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={"xi-api-key": api_key.strip(), "Content-Type": "application/json"},
            json={
                "text": text.strip(),
                "model_id": EL_MODEL,
                "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.3},
            },
            timeout=60,
        )
        r.raise_for_status()
        audio = r.content
    finally:
        _restore_proxies(saved)
    if not audio:
        raise RuntimeError("ElevenLabs returned no audio")
    cache.write_bytes(audio)
    return audio
