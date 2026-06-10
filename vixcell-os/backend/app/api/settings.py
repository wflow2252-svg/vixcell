import os
import shutil
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, RoleChecker
from app.models.user import User
from app.schemas.settings import SettingsPaths, SettingsUpdate
from app.core.config import settings

router = APIRouter()

# Instantiate RBAC checkers
admin_only = RoleChecker(allowed_roles=["admin"])
logger = logging.getLogger(__name__)

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
