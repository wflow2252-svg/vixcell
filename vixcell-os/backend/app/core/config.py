import os
import sys
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import Field
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "Vixcell AI OS"
    API_V1_STR: str = "/api/v1"
    
    # Internal communication key between Electron and FastAPI
    VIXCELL_INTERNAL_API_KEY: str = Field(
        default_factory=lambda: os.getenv("VIXCELL_INTERNAL_API_KEY", "vixcell_secret_dev_key")
    )
    
    # JWT & Security
    SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv("SECRET_KEY", "vixcell_super_secret_jwt_key_change_me_in_prod_1234567890")
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Paths (Default values, will be initialized dynamically)
    STORAGE_ROOT: str = ""
    DB_PATH: str = ""
    MODEL_PATH: str = ""
    UPLOAD_PATH: str = ""
    BACKUP_PATH: str = ""
    LOG_PATH: str = ""
    
    # Database connection string
    DATABASE_URL: str = ""

    class Config:
        case_sensitive = True


def get_default_storage_root() -> Path:
    """
    Detects writable partitions (preferring D: or E:) to store heavy AI models and databases,
    avoiding C: system partition wear. Falls back to %USERPROFILE%/VixcellAI if needed.
    """
    # Check if we are on Windows
    is_windows = sys.platform.startswith("win")
    
    if is_windows:
        # Check D: first, then E:
        for drive in ["D:\\", "E:\\"]:
            if os.path.exists(drive):
                try:
                    # Test writability
                    test_file = Path(drive) / ".vixcell_write_test"
                    test_file.touch()
                    test_file.unlink()
                    return Path(drive) / "VixcellAI"
                except Exception:
                    continue
                    
    # Fallback to User Profile directory on C: (or home on Linux/macOS)
    home_dir = Path(os.path.expanduser("~"))
    return home_dir / "VixcellAI"


def initialize_storage_paths() -> Dict[str, str]:
    """
    Initializes system paths in %APPDATA%/VixcellAI/settings.json
    and creates the corresponding directories on disk.
    """
    is_windows = sys.platform.startswith("win")
    
    # Config file location: APPDATA/VixcellAI/settings.json
    if is_windows:
        app_data = Path(os.getenv("APPDATA", os.path.expanduser("~\\AppData\\Roaming")))
    else:
        app_data = Path(os.path.expanduser("~/.config"))
        
    config_dir = app_data / "VixcellAI"
    config_dir.mkdir(parents=True, exist_ok=True)
    config_file = config_dir / "settings.json"
    
    saved_config = {}
    if config_file.exists():
        try:
            # utf-8-sig tolerates BOM written by Windows editors / PowerShell
            with open(config_file, "r", encoding="utf-8-sig") as f:
                saved_config = json.load(f)
        except Exception as e:
            logger.error(f"Failed to read settings.json: {e}")

    # Resolve storage root: env var override -> saved config -> auto-detect
    storage_root_str = os.getenv("VIXCELL_STORAGE_ROOT")
    if not storage_root_str:
        storage_root_str = saved_config.get("STORAGE_ROOT")
    if not storage_root_str:
        storage_root_str = str(get_default_storage_root())

    storage_root = Path(storage_root_str)
    
    # Define subfolders
    paths = {
        "STORAGE_ROOT": str(storage_root),
        "DB_PATH": str(storage_root / "database" / "vixcell.db"),
        "MODEL_PATH": str(storage_root / "models"),
        "UPLOAD_PATH": str(storage_root / "uploads"),
        "BACKUP_PATH": str(storage_root / "backups"),
        "LOG_PATH": str(storage_root / "logs"),
    }
    
    # Override paths if specified in env or settings.json
    for key in ["DB_PATH", "MODEL_PATH", "UPLOAD_PATH", "BACKUP_PATH", "LOG_PATH"]:
        env_val = os.getenv(f"VIXCELL_{key}")
        if env_val:
            paths[key] = env_val
        elif key in saved_config:
            paths[key] = saved_config[key]

    # Ensure all directories exist
    Path(paths["STORAGE_ROOT"]).mkdir(parents=True, exist_ok=True)
    Path(paths["DB_PATH"]).parent.mkdir(parents=True, exist_ok=True)
    Path(paths["MODEL_PATH"]).mkdir(parents=True, exist_ok=True)
    Path(paths["UPLOAD_PATH"]).mkdir(parents=True, exist_ok=True)
    Path(paths["BACKUP_PATH"]).mkdir(parents=True, exist_ok=True)
    Path(paths["LOG_PATH"]).mkdir(parents=True, exist_ok=True)
    
    # Save back to settings.json to persist values
    try:
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(paths, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to write settings.json: {e}")
        
    return paths


# Load configuration
paths = initialize_storage_paths()

# Set env vars for SQLAlchemy or sub-processes to see
os.environ["VIXCELL_DB_PATH"] = paths["DB_PATH"]

# Instantiate setting object
settings = Settings(
    STORAGE_ROOT=paths["STORAGE_ROOT"],
    DB_PATH=paths["DB_PATH"],
    MODEL_PATH=paths["MODEL_PATH"],
    UPLOAD_PATH=paths["UPLOAD_PATH"],
    BACKUP_PATH=paths["BACKUP_PATH"],
    LOG_PATH=paths["LOG_PATH"]
)

# Set DB URL
# SQLite uses 3 slashes for relative, 4 for absolute path on Windows
db_url_env = os.getenv("DATABASE_URL")
if db_url_env:
    settings.DATABASE_URL = db_url_env
else:
    # Build clean file:// URL for SQLite
    clean_db_path = paths["DB_PATH"].replace("\\", "/")
    # If path starts with drive letter (e.g. D:/), prefix with / for absolute URL
    if ":" in clean_db_path and not clean_db_path.startswith("/"):
        clean_db_path = f"/{clean_db_path}"
    settings.DATABASE_URL = f"sqlite://{clean_db_path}"

# Setup base logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
