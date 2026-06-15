"""
AI Engine — local model inference via Ollama.

Talks to the Ollama HTTP API (default http://127.0.0.1:11434).
Model weights live under settings.MODEL_PATH (OLLAMA_MODELS env),
which the installer pins to a non-system drive (D:/E:).
"""
import logging
import threading
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE = "http://127.0.0.1:11434"

# Recommended catalog surfaced in the UI (name -> meta)
# NOTE: the bare qwen3:4b tag is the *Thinking* variant which always emits
# chain-of-thought and is slow for content tasks — prefer the Instruct tag.
MODEL_CATALOG = [
    {"name": "qwen3:4b-instruct-2507-q4_K_M", "label": "Qwen3 4B Instruct", "size": "2.5 GB", "languages": "Arabic + English", "good_for": "Fast content generation (recommended)"},
    {"name": "qwen3:4b",        "label": "Qwen3 4B Thinking", "size": "2.6 GB", "languages": "Arabic + English", "good_for": "Step-by-step reasoning (slower)"},
    {"name": "qwen3:8b",        "label": "Qwen3 8B",        "size": "5.2 GB", "languages": "Arabic + English", "good_for": "Higher quality content"},
    {"name": "llama3.1:8b",     "label": "Llama 3.1 8B",    "size": "4.9 GB", "languages": "English (Arabic OK)", "good_for": "Reasoning, summaries"},
    {"name": "mistral:7b",      "label": "Mistral 7B",      "size": "4.1 GB", "languages": "English",          "good_for": "Fast drafting"},
    {"name": "deepseek-r1:8b",  "label": "DeepSeek R1 8B",  "size": "5.2 GB", "languages": "English + Arabic", "good_for": "Deep reasoning"},
    {"name": "qwen2.5vl:7b",    "label": "Qwen2.5-VL 7B (رؤية)", "size": "6.0 GB", "languages": "Arabic + English", "good_for": "Reading handwriting/whiteboard → text (vision OCR)"},
    {"name": "qwen2.5vl:3b",    "label": "Qwen2.5-VL 3B (رؤية، أخف)", "size": "3.2 GB", "languages": "Arabic + English", "good_for": "Lighter vision OCR for weaker machines"},
]

# Preferred default for generation when installed (instruct = no think blocks)
PREFERRED_MODELS = ["qwen3:4b-instruct-2507-q4_K_M", "qwen3:4b"]

# In-memory pull progress keyed by model name
_pull_status: dict = {}
_pull_lock = threading.Lock()


def is_running(timeout: float = 2.0) -> Optional[str]:
    """Returns the Ollama version string when the service is reachable, else None."""
    try:
        r = httpx.get(f"{OLLAMA_BASE}/api/version", timeout=timeout)
        r.raise_for_status()
        return r.json().get("version")
    except Exception:
        return None


def list_local_models() -> list:
    r = httpx.get(f"{OLLAMA_BASE}/api/tags", timeout=5)
    r.raise_for_status()
    models = r.json().get("models", [])
    return [
        {
            "name": m["name"],
            "size_bytes": m.get("size", 0),
            "size_gb": round(m.get("size", 0) / (1024 ** 3), 2),
            "modified_at": m.get("modified_at"),
            "family": (m.get("details") or {}).get("family"),
            "parameter_size": (m.get("details") or {}).get("parameter_size"),
        }
        for m in models
    ]


def delete_model(name: str) -> None:
    r = httpx.request("DELETE", f"{OLLAMA_BASE}/api/delete", json={"model": name}, timeout=30)
    r.raise_for_status()


def _pull_worker(name: str) -> None:
    """Streams a model pull, updating _pull_status as layers download."""
    try:
        with httpx.stream(
            "POST", f"{OLLAMA_BASE}/api/pull",
            json={"model": name, "stream": True}, timeout=None,
        ) as resp:
            resp.raise_for_status()
            import json as _json
            for line in resp.iter_lines():
                if not line:
                    continue
                evt = _json.loads(line)
                with _pull_lock:
                    _pull_status[name] = {
                        "status": evt.get("status", ""),
                        "total": evt.get("total"),
                        "completed": evt.get("completed"),
                        "percent": round(evt["completed"] / evt["total"] * 100, 1)
                        if evt.get("total") and evt.get("completed") else None,
                        "done": evt.get("status") == "success",
                        "error": None,
                    }
        with _pull_lock:
            cur = _pull_status.get(name, {})
            cur.update({"done": True})
            _pull_status[name] = cur
    except Exception as e:
        logger.error(f"Model pull failed for {name}: {e}")
        with _pull_lock:
            _pull_status[name] = {"status": "error", "done": True, "error": str(e)}


def start_pull(name: str) -> dict:
    """Kicks off a background pull; returns current status snapshot."""
    with _pull_lock:
        existing = _pull_status.get(name)
        if existing and not existing.get("done"):
            return existing
        _pull_status[name] = {"status": "starting", "done": False, "error": None, "percent": 0}
    threading.Thread(target=_pull_worker, args=(name,), daemon=True).start()
    return _pull_status[name]


def pull_progress(name: str) -> dict:
    with _pull_lock:
        return _pull_status.get(name, {"status": "unknown", "done": False, "error": None})


def warm_preferred_model_async() -> None:
    """
    Loads the preferred local model into memory in the background so the
    first voice/content request doesn't pay the cold-load cost. No-op when
    Ollama isn't running or no preferred model is installed.
    """
    def _warm():
        try:
            if not is_running():
                return
            installed = {m["name"] for m in list_local_models()}
            model = next((m for m in PREFERRED_MODELS if m in installed), None)
            if not model:
                return
            httpx.post(
                f"{OLLAMA_BASE}/api/generate",
                json={"model": model, "prompt": "", "keep_alive": "30m"},
                timeout=120,
            )
            logger.info(f"Warmed Ollama model {model}")
        except Exception as e:
            logger.debug(f"Ollama warmup skipped: {e}")

    threading.Thread(target=_warm, daemon=True, name="ollama-warmup").start()


# Vision-capable local models, in preference order.
# Qwen2.5-VL first: far better at multilingual OCR (incl. Arabic handwriting)
# than llava, so it's preferred for the whiteboard handwriting→text feature.
VISION_MODELS = ["qwen2.5vl", "qwen2.5vl:7b", "qwen2.5vl:3b", "llava", "llava:7b", "llama3.2-vision", "bakllava", "moondream"]


def installed_vision_model() -> Optional[str]:
    """First installed vision model (prefix match on the tag), else None."""
    try:
        installed = [m["name"] for m in list_local_models()]
    except Exception:
        return None
    for pref in VISION_MODELS:
        for name in installed:
            if name == pref or name.startswith(pref + ":") or name.split(":")[0] == pref:
                return name
    return None


def vision(model: str, prompt: str, image_b64: str,
           temperature: float = 0.2, timeout: float = 300.0,
           max_tokens: int = 600) -> str:
    """
    Multimodal single-shot: send a base64 PNG/JPEG + prompt to a local vision
    model (llava etc.) via Ollama /api/generate. Returns the description.
    """
    r = httpx.post(
        f"{OLLAMA_BASE}/api/generate",
        json={
            "model": model,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens, "num_ctx": 8192},
            "keep_alive": "15m",
        },
        timeout=timeout,
    )
    r.raise_for_status()
    return _strip_think((r.json().get("response") or "").strip())


def gemini_vision(image_b64: str, api_key: str, prompt: str,
                  model: str = "gemini-2.0-flash", timeout: float = 60.0) -> str:
    """
    Image → text via Google Gemini (free tier). Far better at Arabic handwriting
    than local models. `image_b64` is raw base64 (no dataURL prefix).
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    r = httpx.post(url, json={
        "contents": [{"parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": "image/png", "data": image_b64}},
        ]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800},
    }, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts).strip()
    except (KeyError, IndexError):
        return ""


def _strip_think(text: str) -> str:
    """Removes <think>...</think> reasoning blocks some models emit inline."""
    if "</think>" in text:
        text = text.split("</think>")[-1]
    return text.strip()


def chat(
    model: str,
    prompt: str,
    system: Optional[str] = None,
    temperature: float = 0.7,
    timeout: float = 420.0,
    # Generous cap: qwen3's template pre-opens a <think> block, so the model
    # spends tokens reasoning before the closing tag and the real answer.
    # _strip_think removes the reasoning; the cap must cover both parts.
    max_tokens: int = 1400,
    repeat_penalty: Optional[float] = None,
) -> str:
    """Single-turn chat completion. Raises httpx errors upward for the API layer."""
    # Qwen3-family soft switch: appending /no_think to the system prompt
    # disables chain-of-thought (the API-level "think" flag alone is not
    # always honored), which cuts generation time dramatically on CPU.
    if "qwen3" in model.lower():
        system = f"{system or ''} /no_think".strip()

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    # num_ctx capped so the KV cache stays small — without it Ollama can try to
    # allocate the model's full (256K) context and OOM, especially when a vision
    # model is also loaded (Cowork + whiteboard OCR together).
    options = {"temperature": temperature, "num_predict": max_tokens, "num_ctx": 8192}
    # Higher repeat penalty curbs the "بس بس بس" degeneration small quantized
    # models fall into on free-form Arabic prose.
    if repeat_penalty is not None:
        options["repeat_penalty"] = repeat_penalty
        options["repeat_last_n"] = 64

    r = httpx.post(
        f"{OLLAMA_BASE}/api/chat",
        json={
            "model": model,
            "messages": messages,
            "stream": False,
            "think": False,
            "options": options,
            "keep_alive": "30m",
        },
        timeout=timeout,
    )
    r.raise_for_status()
    content = (r.json().get("message") or {}).get("content", "")
    return _strip_think(content)
