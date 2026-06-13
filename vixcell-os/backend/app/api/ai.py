import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
import httpx

from app.api.dependencies import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.services import ai_engine

logger = logging.getLogger(__name__)
router = APIRouter()

OLLAMA_DOWN_MSG = (
    "Ollama is not running. Start it from the AI Models page or install it first."
)


class GenerateIn(BaseModel):
    model: str
    prompt: str
    system: Optional[str] = None
    temperature: float = 0.7


class ContentIn(BaseModel):
    model: str
    content_type: str          # facebook_post | instagram_caption | tiktok_script | ad_copy | email | blog_article | product_description
    topic: str
    language: str = "ar"       # ar | en | ar-eg
    tone: Optional[str] = None # friendly | professional | funny ...
    extra: Optional[str] = None


CONTENT_TEMPLATES = {
    "facebook_post":       "Write a Facebook post about: {topic}. Include a hook, value, and a call to action with 3-5 relevant hashtags.",
    "instagram_caption":   "Write an Instagram caption about: {topic}. Punchy first line, short body, emoji-friendly, end with 5 hashtags.",
    "tiktok_script":       "Write a 30-second TikTok video script about: {topic}. Format: HOOK (3s), BODY (20s), CTA (7s) with spoken lines and on-screen text.",
    "ad_copy":             "Write ad copy for: {topic}. Provide 3 headline options (max 40 chars each), 2 descriptions (max 125 chars), and one CTA.",
    "email":               "Write a marketing email about: {topic}. Subject line + preview text + body (under 150 words) + CTA button text.",
    "blog_article":        "Write a blog article about: {topic}. Include title, intro, 3-4 H2 sections, and a conclusion with CTA. SEO-friendly.",
    "product_description": "Write a product description for: {topic}. Highlight benefits over features, add a specs bullet list and a closing line.",
    "whatsapp_message":    "Write a short, friendly WhatsApp message about: {topic}. One or two sentences, warm and personal, no preamble — output only the message text ready to send.",
}

LANGUAGE_DIRECTIVES = {
    "ar":    "اكتب الناتج كاملاً باللغة العربية الفصحى المبسطة.",
    "ar-eg": "اكتب الناتج كاملاً باللهجة المصرية العامية الودودة.",
    "en":    "Write the entire output in English.",
}


@router.get("/status")
def ai_status(current_user: User = Depends(get_current_active_user)):
    """
    Ollama availability + where model weights are stored.
    """
    version = ai_engine.is_running()
    return {
        "running": version is not None,
        "version": version,
        "model_storage": settings.MODEL_PATH,
        "catalog": ai_engine.MODEL_CATALOG,
    }


@router.get("/models")
def list_models(current_user: User = Depends(get_current_active_user)):
    if not ai_engine.is_running():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=OLLAMA_DOWN_MSG)
    try:
        return {"models": ai_engine.list_local_models()}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Ollama error: {e}")


@router.post("/models/pull")
def pull_model(
    name: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user),
):
    if not ai_engine.is_running():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=OLLAMA_DOWN_MSG)
    return ai_engine.start_pull(name)


@router.get("/models/pull/{name:path}/progress")
def pull_model_progress(
    name: str,
    current_user: User = Depends(get_current_active_user),
):
    return ai_engine.pull_progress(name)


@router.delete("/models/{name:path}")
def delete_model(
    name: str,
    current_user: User = Depends(get_current_active_user),
):
    if not ai_engine.is_running():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=OLLAMA_DOWN_MSG)
    try:
        ai_engine.delete_model(name)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Ollama error: {e}")
    return {"deleted": name}


@router.post("/generate")
def generate(
    body: GenerateIn,
    current_user: User = Depends(get_current_active_user),
):
    """
    Raw single-turn generation against a local model.
    """
    if not ai_engine.is_running():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=OLLAMA_DOWN_MSG)
    try:
        text = ai_engine.chat(
            model=body.model, prompt=body.prompt,
            system=body.system, temperature=body.temperature,
        )
        return {"text": text, "model": body.model}
    except httpx.HTTPStatusError as e:
        detail = e.response.text[:300] if e.response is not None else str(e)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Ollama error: {detail}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Ollama error: {e}")


@router.post("/content")
def generate_content(
    body: ContentIn,
    current_user: User = Depends(get_current_active_user),
):
    """
    Marketing content generation with task templates and language control
    (Arabic, Egyptian Arabic, English).
    """
    if body.content_type not in CONTENT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown content_type. Allowed: {list(CONTENT_TEMPLATES)}",
        )
    if not ai_engine.is_running():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=OLLAMA_DOWN_MSG)

    prompt = CONTENT_TEMPLATES[body.content_type].format(topic=body.topic)
    if body.tone:
        prompt += f"\nTone of voice: {body.tone}."
    if body.extra:
        prompt += f"\nAdditional instructions: {body.extra}"

    system = (
        "You are Vixcell AI, a senior marketing copywriter. "
        "Output only the requested content — no preamble, no explanations. "
        + LANGUAGE_DIRECTIVES.get(body.language, LANGUAGE_DIRECTIVES["en"])
    )

    try:
        text = ai_engine.chat(model=body.model, prompt=prompt, system=system, temperature=0.8)
        return {"text": text, "model": body.model, "content_type": body.content_type}
    except httpx.HTTPStatusError as e:
        detail = e.response.text[:300] if e.response is not None else str(e)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Ollama error: {detail}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Ollama error: {e}")
