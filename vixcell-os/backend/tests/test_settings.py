import pytest
import os
import json
from pathlib import Path
from app.models.tenant import Tenant
from app.core.config import settings

def test_settings_endpoints(client, db):
    """
    Test reading and writing storage configurations, and database backups.
    """
    # 1. Setup Admin
    setup_payload = {
        "company_name": "Test Org",
        "admin_name": "Admin User",
        "admin_email": "admin@test.com",
        "admin_password": "supersecurepassword123"
    }
    tokens = client.post("/api/v1/auth/wizard/setup", json=setup_payload).json()
    admin_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 2. Get current paths
    response = client.get("/api/v1/settings/paths", headers=headers)
    assert response.status_code == 200
    paths = response.json()
    assert "DB_PATH" in paths
    assert "STORAGE_ROOT" in paths
    
    # 3. Update paths (with test path validation)
    # We will test saving paths. Use a subfolder in the current temp dir
    test_storage_root = str(Path(settings.STORAGE_ROOT) / "temp_test_root")
    update_payload = {
        "STORAGE_ROOT": test_storage_root,
        "MODEL_PATH": str(Path(test_storage_root) / "models"),
    }
    
    # Run PUT settings paths
    response = client.put("/api/v1/settings/paths", json=update_payload, headers=headers)
    assert response.status_code == 200
    res_paths = response.json()
    assert res_paths["STORAGE_ROOT"] == test_storage_root
    
    # Verify changes were saved to settings.json
    app_data = Path(os.getenv("APPDATA", os.path.expanduser("~\\AppData\\Roaming"))) if os.name == "nt" else Path(os.path.expanduser("~/.config"))
    config_file = app_data / "VixcellAI" / "settings.json"
    assert config_file.exists()
    
    with open(config_file, "r") as f:
        saved_config = json.load(f)
    assert saved_config["STORAGE_ROOT"] == test_storage_root
    
    # Cleanup: remove created test dirs
    if os.path.exists(test_storage_root):
        import shutil
        shutil.rmtree(test_storage_root)


def test_trigger_backup(client, db):
    """
    Test trigger_backup endpoint on SQLite database.
    """
    # Create the directory and a dummy database file so the backend doesn't raise 404
    db_file = Path(settings.DB_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    db_file.touch()

    try:
        # 1. Setup Admin
        setup_payload = {
            "company_name": "Test Org",
            "admin_name": "Admin User",
            "admin_email": "admin@test.com",
            "admin_password": "supersecurepassword123"
        }
        tokens = client.post("/api/v1/auth/wizard/setup", json=setup_payload).json()
        admin_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 2. Trigger backup
        response = client.post("/api/v1/settings/backup", headers=headers)
        assert response.status_code == 200
        res = response.json()
        assert res["success"] is True
        assert "backup_file" in res
        assert os.path.exists(res["backup_file"])
        
        # Clean up backup file
        if os.path.exists(res["backup_file"]):
            os.remove(res["backup_file"])
    finally:
        if db_file.exists():
            db_file.unlink()

