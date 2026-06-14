"""
Public endpoints (NO internal-key) reachable from the vixcell.com meeting running
in the ADMIN's own browser, so the web whiteboard can use the LOCAL vision model
(llava) to turn handwriting into clean text.

Safe because the backend binds to 127.0.0.1 — only the admin's own machine can
reach it. CORS + Private-Network-Access headers are handled in main.py.
"""
import logging
from fastapi import APIRouter, Body, HTTPException, status

from app.services import ai_engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/ping")
def ping():
    """Lets the website discover which local port the app is on, and whether a
    vision model is installed."""
    return {"ok": True, "app": "vixcell-os", "vision": bool(ai_engine.installed_vision_model())}


@router.post("/wb-ocr")
def wb_ocr(body: dict = Body(...)):
    """Whiteboard image (base64/dataURL) → clean transcribed text via local llava."""
    image = ((body or {}).get("image") or (body or {}).get("imageBase64") or "")
    if isinstance(image, str) and image.strip().startswith("data:") and "," in image:
        image = image.split(",", 1)[1]
    image = (image or "").strip()
    if not image:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="no image")

    model = ai_engine.installed_vision_model()
    if not model:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="مفيش نموذج رؤية متنزّل (llava) على الجهاز")

    prompt = (
        "You are a precise OCR engine. The image is a whiteboard with handwriting "
        "and/or drawings. Transcribe ALL readable text EXACTLY as written, keeping "
        "line breaks. Output ONLY the transcribed text — no quotes, no commentary, "
        "no explanations. If a word is unclear, give your best guess."
    )
    try:
        text = ai_engine.vision(model, prompt, image, temperature=0.1, timeout=180, max_tokens=500)
    except Exception as e:
        logger.warning(f"wb-ocr failed: {e}")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="فشل قراءة السبورة")
    return {"success": True, "text": (text or "").strip()}
