"""
Public endpoints (NO internal-key) reachable from the vixcell.com meeting running
in the admin's own browser, so the web whiteboard can use the device's AI to turn
handwriting into clean text.

Safe because the backend binds to 127.0.0.1 — only the admin's own machine can
reach it. CORS + Private-Network-Access headers are handled in main.py.
"""
import logging
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.integration import IntegrationConfig
from app.services import ai_engine

logger = logging.getLogger(__name__)
router = APIRouter()

_OCR_PROMPT = (
    "Transcribe the handwriting in this image to clean digital text. The text may "
    "be Arabic or English. Output ONLY the transcription, in the SAME language and "
    "script it was written in, preserving line breaks. No quotes, no comments, no "
    "translation. If a word is unclear, give your best guess."
)


@router.get("/ping")
def ping(db: Session = Depends(get_db)):
    """Lets the website discover the local port + which OCR engines are available."""
    has_gemini = False
    try:
        row = (db.query(IntegrationConfig)
               .filter(IntegrationConfig.provider == "gemini", IntegrationConfig.enabled == True)  # noqa: E712
               .first())
        has_gemini = bool(row and (row.config or {}).get("api_key"))
    except Exception:
        has_gemini = False
    return {"ok": True, "app": "vixcell-os", "gemini": has_gemini,
            "vision": bool(ai_engine.installed_vision_model())}


@router.post("/wb-ocr")
def wb_ocr(body: dict = Body(...), db: Session = Depends(get_db)):
    """Whiteboard image (base64/dataURL) → clean text. Prefers Gemini (best for
    Arabic handwriting) when a key is configured, else the local vision model."""
    image = ((body or {}).get("image") or (body or {}).get("imageBase64") or "")
    if isinstance(image, str) and image.strip().startswith("data:") and "," in image:
        image = image.split(",", 1)[1]
    image = (image or "").strip()
    if not image:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="no image")

    # 1) Gemini (cloud, free tier) — reads Arabic handwriting well
    gem_key = ""
    try:
        row = (db.query(IntegrationConfig)
               .filter(IntegrationConfig.provider == "gemini", IntegrationConfig.enabled == True)  # noqa: E712
               .first())
        gem_key = ((row.config or {}).get("api_key") or "").strip() if row else ""
    except Exception:
        gem_key = ""
    if gem_key:
        try:
            text = ai_engine.gemini_vision(image, gem_key, _OCR_PROMPT)
            if text:
                return {"success": True, "text": text, "engine": "gemini"}
        except Exception as e:
            logger.warning(f"Gemini OCR failed, falling back to local: {e}")

    # 2) Local vision model (llava) — free, weaker on Arabic handwriting
    model = ai_engine.installed_vision_model()
    if not model:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="حط مفتاح Gemini في الإعدادات (أو نزّل نموذج رؤية محلي)")
    try:
        text = ai_engine.vision(model, _OCR_PROMPT, image, temperature=0.1, timeout=180, max_tokens=500)
    except Exception as e:
        logger.warning(f"local OCR failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="فشل قراءة السبورة")
    return {"success": True, "text": (text or "").strip(), "engine": "local"}
