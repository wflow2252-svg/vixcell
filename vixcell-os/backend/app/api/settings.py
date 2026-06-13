import os
import shutil
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.models.user import User
from app.models.integration import IntegrationConfig
from app.schemas.settings import SettingsPaths, SettingsUpdate
from app.core.config import settings

router = APIRouter()

# Instantiate RBAC checkers
admin_only = RoleChecker(allowed_roles=["admin"])
logger = logging.getLogger(__name__)

# Catalog of connectable services. `fields` drives the frontend form so
# users always know exactly what to paste and where it goes.
INTEGRATION_PROVIDERS: Dict[str, Dict[str, Any]] = {
    "vixcell_website": {
        "label": "Vixcell Website (vixcell.com)",
        "icon": "🌐",
        "help": "ربط النظام بموقعكم — التاسكات والمشاريع والميتنج. سيب القيم الافتراضية لو الموقع vixcell.com",
        "fields": [
            {"key": "site_url", "label": "Site URL (default: https://vixcell.com)", "secret": False},
            {"key": "api_base", "label": "API Base (default: <site>/api)", "secret": False},
        ],
    },
    "whatsapp": {
        "label": "WhatsApp Business API",
        "icon": "💬",
        "help": "Meta for Developers → WhatsApp → API Setup",
        "setup_url": "https://developers.facebook.com/apps/",
        "fields": [
            {"key": "access_token", "label": "Access Token", "secret": True},
            {"key": "phone_number_id", "label": "Phone Number ID", "secret": False},
            {"key": "business_account_id", "label": "Business Account ID", "secret": False},
        ],
    },
    "meta": {
        "label": "Facebook / Meta API",
        "icon": "📘",
        "help": "Meta for Developers → App → Page Access Token",
        "setup_url": "https://developers.facebook.com/apps/",
        "fields": [
            {"key": "page_id", "label": "Page ID", "secret": False},
            {"key": "page_access_token", "label": "Page Access Token", "secret": True},
        ],
    },
    "google_business": {
        "label": "Google Business / Maps",
        "icon": "🗺️",
        "help": "Google Cloud Console → APIs & Services → Credentials",
        "setup_url": "https://console.cloud.google.com/apis/credentials",
        "fields": [
            {"key": "api_key", "label": "API Key", "secret": True},
        ],
    },
    "elevenlabs": {
        "label": "ElevenLabs (صوت بشري احترافي)",
        "icon": "🗣️",
        "help": "elevenlabs.io → Profile → API Key. سيب voice_id فاضي للصوت الافتراضي",
        "setup_url": "https://elevenlabs.io/app/settings/api-keys",
        "fields": [
            {"key": "api_key", "label": "API Key", "secret": True},
            {"key": "voice_id", "label": "Voice ID (اختياري)", "secret": False},
        ],
    },
    "smtp": {
        "label": "Email (SMTP)",
        "icon": "✉️",
        "help": "بيانات SMTP من مزود الإيميل (مثلاً Gmail App Password)",
        "setup_url": "https://myaccount.google.com/apppasswords",
        "fields": [
            {"key": "host", "label": "SMTP Host", "secret": False},
            {"key": "port", "label": "Port", "secret": False},
            {"key": "username", "label": "Username", "secret": False},
            {"key": "password", "label": "Password", "secret": True},
            {"key": "from_email", "label": "From Email", "secret": False},
        ],
    },
}


class IntegrationUpdateIn(BaseModel):
    enabled: bool = True
    config: Dict[str, Any] = {}


@router.get("/integrations")
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """
    All connectable services with their form fields, plus what's already
    saved for this tenant. This is THE place to wire external accounts.
    """
    saved = {
        row.provider: row
        for row in db.query(IntegrationConfig).filter(
            IntegrationConfig.tenant_id == current_user.tenant_id
        ).all()
    }
    out = []
    for key, meta in INTEGRATION_PROVIDERS.items():
        row = saved.get(key)
        cfg = (row.config or {}) if row else {}
        required = [f["key"] for f in meta["fields"]]
        out.append({
            "provider": key,
            "label": meta["label"],
            "icon": meta["icon"],
            "help": meta["help"],
            "setup_url": meta.get("setup_url"),
            "fields": meta["fields"],
            "enabled": row.enabled if row else False,
            "configured": bool(row) and all(cfg.get(k) for k in required),
            "config": cfg,
        })
    return {"items": out}


@router.put("/integrations/{provider}")
def update_integration(
    provider: str,
    body: IntegrationUpdateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """Saves (upserts) credentials for one service. Local SQLite only."""
    if provider not in INTEGRATION_PROVIDERS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Unknown provider. Allowed: {list(INTEGRATION_PROVIDERS)}")
    row = db.query(IntegrationConfig).filter(
        IntegrationConfig.tenant_id == current_user.tenant_id,
        IntegrationConfig.provider == provider,
    ).first()
    if not row:
        row = IntegrationConfig(tenant_id=current_user.tenant_id, provider=provider)
        db.add(row)
    row.enabled = body.enabled
    row.config = {k: v for k, v in body.config.items() if v not in (None, "")}
    db.commit()
    required = [f["key"] for f in INTEGRATION_PROVIDERS[provider]["fields"]]
    return {
        "provider": provider,
        "enabled": row.enabled,
        "configured": all((row.config or {}).get(k) for k in required),
    }

@router.get("/paths", response_model=SettingsPaths)
def get_paths(current_user: User = Depends(admin_only)):
    """
    Retrieves the current storage configuration paths. System Admin only.
    """
    return SettingsPaths(
        STORAGE_ROOT=settings.STORAGE_ROOT,
        DB_PATH=settings.DB_PATH,
        MODEL_PATH=settings.MODEL_PATH,
        UPLOAD_PATH=settings.UPLOAD_PATH,
        BACKUP_PATH=settings.BACKUP_PATH,
        LOG_PATH=settings.LOG_PATH
    )


@router.put("/paths", response_model=SettingsPaths)
def update_paths(
    paths_in: SettingsUpdate = Body(...),
    current_user: User = Depends(admin_only)
):
    """
    Updates system storage paths in settings.json. System Admin only.
    """
    app_data = Path(os.getenv("APPDATA", os.path.expanduser("~\\AppData\\Roaming"))) if os.name == "nt" else Path(os.path.expanduser("~/.config"))
    config_file = app_data / "VixcellAI" / "settings.json"
    
    if not config_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration file settings.json not found."
        )

    try:
        with open(config_file, "r", encoding="utf-8") as f:
            current_config = json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read settings.json: {str(e)}"
        )

    # Validate and apply updates
    update_data = paths_in.model_dump(exclude_unset=True)
    
    # Check that paths are writable
    for key, path_str in update_data.items():
        if path_str:
            p = Path(path_str)
            # If it's the DB path, check the parent directory
            target_dir = p.parent if key == "DB_PATH" else p
            try:
                target_dir.mkdir(parents=True, exist_ok=True)
                test_file = target_dir / ".write_test"
                test_file.touch()
                test_file.unlink()
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Path {path_str} is not writable or valid: {str(e)}"
                )
            current_config[key] = path_str

    # Write back to settings.json
    try:
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(current_config, f, indent=4)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write settings.json: {str(e)}"
        )

    # Note: Dynamic runtime path changing requires restarting the FastAPI server
    # to reload SQLAlchemy engine bindings. Let frontend know it's saved.
    return SettingsPaths(
        STORAGE_ROOT=current_config.get("STORAGE_ROOT", settings.STORAGE_ROOT),
        DB_PATH=current_config.get("DB_PATH", settings.DB_PATH),
        MODEL_PATH=current_config.get("MODEL_PATH", settings.MODEL_PATH),
        UPLOAD_PATH=current_config.get("UPLOAD_PATH", settings.UPLOAD_PATH),
        BACKUP_PATH=current_config.get("BACKUP_PATH", settings.BACKUP_PATH),
        LOG_PATH=current_config.get("LOG_PATH", settings.LOG_PATH)
    )


class VoiceSettingsIn(BaseModel):
    whisper_model: str


@router.get("/voice")
def get_voice_settings(current_user: User = Depends(admin_only)):
    """Current speech-recognition model + the choices (bigger = more accurate, slower)."""
    from app.services import voice_engine
    return {
        "whisper_model": voice_engine.configured_model_size(),
        "allowed": voice_engine.ALLOWED_WHISPER_MODELS,
    }


@router.put("/voice")
def update_voice_settings(
    body: VoiceSettingsIn,
    current_user: User = Depends(admin_only),
):
    """Persists the Whisper model size to settings.json. Applies after restart."""
    from app.services import voice_engine
    if body.whisper_model not in voice_engine.ALLOWED_WHISPER_MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"whisper_model must be one of {voice_engine.ALLOWED_WHISPER_MODELS}",
        )
    app_data = Path(os.getenv("APPDATA", os.path.expanduser("~\\AppData\\Roaming"))) if os.name == "nt" else Path(os.path.expanduser("~/.config"))
    config_file = app_data / "VixcellAI" / "settings.json"
    current_config = {}
    if config_file.exists():
        try:
            with open(config_file, "r", encoding="utf-8-sig") as f:
                current_config = json.load(f)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Failed to read settings.json: {e}")
    current_config["WHISPER_MODEL"] = body.whisper_model
    config_file.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(current_config, f, indent=4)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to write settings.json: {e}")
    return {"whisper_model": body.whisper_model, "restart_required": True}


@router.post("/backup")
def trigger_backup(current_user: User = Depends(admin_only)):
    """
    Performs an instant backup of the SQLite database. System Admin only.
    """
    if not settings.DATABASE_URL.startswith("sqlite"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Automated backups are currently supported only for local SQLite installations."
        )

    db_file = Path(settings.DB_PATH)
    if not db_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SQLite database file not found on disk."
        )

    backup_dir = Path(settings.BACKUP_PATH) / "db_backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"vixcell_backup_{timestamp}.db"
    
    try:
        # Perform safe file copy
        shutil.copy2(str(db_file), str(backup_file))
        logger.info(f"Database backed up successfully to {backup_file}")
        return {
            "success": True,
            "backup_file": str(backup_file),
            "timestamp": timestamp
        }
    except Exception as e:
        logger.error(f"Database backup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup execution failed: {str(e)}"
        )
