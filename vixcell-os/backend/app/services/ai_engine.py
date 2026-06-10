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

    r = httpx.post(
        f"{OLLAMA_BASE}/api/chat",
        json={
            "model": model,
            "messages": messages,
            "stream": False,
            "think": False,
            # Cap output length and keep the model warm between requests —
            # essential on modest hardware
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "keep_alive": "30m",
        },
        timeout=timeout,
    )
    r.raise_for_status()
    content = (r.json().get("message") or {}).get("content", "")
    return _strip_think(content)
