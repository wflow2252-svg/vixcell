from typing import Optional
from pydantic import BaseModel

class SettingsPaths(BaseModel):
    STORAGE_ROOT: str
    DB_PATH: str
    MODEL_PATH: str
    UPLOAD_PATH: str
    BACKUP_PATH: str
    LOG_PATH: str

class SettingsUpdate(BaseModel):
    STORAGE_ROOT: Optional[str] = None
    DB_PATH: Optional[str] = None
    MODEL_PATH: Optional[str] = None
    UPLOAD_PATH: Optional[str] = None
    BACKUP_PATH: Optional[str] = None
    LOG_PATH: Optional[str] = None
