import os
from pathlib import Path
from app.core import config


def test_get_default_storage_root():
    root = config.get_default_storage_root()
    assert root is not None
    assert isinstance(root, Path)
    # Check that it resolves to a valid folder structure path
    assert "VixcellAI" in root.parts or "VixcellAI" in str(root)


def test_initialize_storage_paths(tmp_path, monkeypatch):
    # Fully sandboxed: fake APPDATA + storage root so the real user
    # settings.json is never read or written by this test.
    monkeypatch.setenv("APPDATA", str(tmp_path / "AppData"))
    monkeypatch.setenv("VIXCELL_STORAGE_ROOT", str(tmp_path / "storage"))

    paths = config.initialize_storage_paths()
    assert "STORAGE_ROOT" in paths
    assert "DB_PATH" in paths
    assert "MODEL_PATH" in paths
    assert "UPLOAD_PATH" in paths
    assert "BACKUP_PATH" in paths
    assert "LOG_PATH" in paths

    # Paths stayed inside the sandbox
    assert paths["STORAGE_ROOT"].startswith(str(tmp_path))

    # Verify that directories are actually created on disk
    assert os.path.exists(paths["STORAGE_ROOT"])
    assert os.path.exists(paths["MODEL_PATH"])
    assert os.path.exists(paths["UPLOAD_PATH"])
    assert os.path.exists(paths["BACKUP_PATH"])
    assert os.path.exists(paths["LOG_PATH"])
    # Database directory parent must exist
    assert os.path.exists(os.path.dirname(paths["DB_PATH"]))

    # settings.json was written inside the fake APPDATA, not the real one
    assert (tmp_path / "AppData" / "VixcellAI" / "settings.json").exists()
