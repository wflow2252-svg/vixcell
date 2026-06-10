import pytest
import os
import tempfile
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set env keys before importing app components
os.environ["VIXCELL_INTERNAL_API_KEY"] = "test_internal_key"
os.environ["SECRET_KEY"] = "test_secret_jwt_key_1234567890"

# Isolate ALL storage side effects (settings.json in APPDATA, directory
# creation) into a throwaway temp sandbox so tests never touch the user's
# real %APPDATA%\VixcellAI configuration or real drives.
_test_sandbox = tempfile.mkdtemp(prefix="vixcell_test_")
os.environ["APPDATA"] = os.path.join(_test_sandbox, "AppData")
os.environ["VIXCELL_STORAGE_ROOT"] = os.path.join(_test_sandbox, "storage")

from app.core.config import settings
settings.DATABASE_URL = "sqlite:///:memory:"

from app.core.database import Base
from app.api.dependencies import get_db
from app.main import app

# Create in-memory SQLite database engine for test isolation
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db() -> Generator:
    """
    Creates tables, yields a session, and drops tables after each test.
    """
    Base.metadata.create_all(bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db) -> Generator:
    """
    Overrides the get_db dependency and returns a TestClient.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        # Include internal app key header by default on test client
        c.headers["X-Vixcell-Internal-Key"] = "test_internal_key"
        yield c
    app.dependency_overrides.clear()
