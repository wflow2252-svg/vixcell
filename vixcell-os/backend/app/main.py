from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import engine, Base
from app.api import auth, tenants, settings as settings_api, leads, crm, dashboard, ai, voice, system, website, memory, whatsapp, projects, tasks, meetings, training
import logging

# Initialize Logging
setup_logging()
logger = logging.getLogger(__name__)

# Automate Database Table Creation (Zero-config startup)
try:
    logger.info("Initializing database schemas...")
    import app.models  # Ensure models are loaded to register metadata
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas initialized successfully.")
except Exception as e:
    logger.error(f"Critical error during database initialization: {e}")

# Create FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Custom Security Middleware: Restricts access exclusively to the Electron sidecar process
@app.middleware("http")
async def verify_internal_app_key(request: Request, call_next):
    path = request.url.path

    # CORS preflight requests never carry custom headers — let CORSMiddleware answer them
    if request.method == "OPTIONS":
        return await call_next(request)

    # Bypass verification for open docs and health check
    bypass_paths = [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health"
    ]

    if path in bypass_paths or path.startswith("/static/"):
        return await call_next(request)
        
    # Check for internal key header
    internal_key = request.headers.get("X-Vixcell-Internal-Key")
    
    # Reject request if the internal API key doesn't match
    if internal_key != settings.VIXCELL_INTERNAL_API_KEY:
        logger.warning(f"Unauthorized external access attempt blocked on path: {path}")
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Forbidden. Unauthorized internal application access."}
        )
        
    return await call_next(request)


# Configure CORS Middleware — added AFTER the key middleware so it runs
# OUTERMOST: preflights are answered here, and 403s from the key check
# still receive CORS headers (otherwise browsers report them as network
# failures instead of showing the real status).
# Allows the local Electron React app (file:// or localhost origins) to communicate.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Desktop-local API bound to 127.0.0.1; key middleware does the gating
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(tenants.router, prefix=f"{settings.API_V1_STR}/tenants", tags=["Tenants"])
app.include_router(settings_api.router, prefix=f"{settings.API_V1_STR}/settings", tags=["Settings"])
app.include_router(leads.router, prefix=f"{settings.API_V1_STR}/leads", tags=["Leads"])
app.include_router(crm.router, prefix=f"{settings.API_V1_STR}/crm", tags=["CRM"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Engine"])
app.include_router(voice.router, prefix=f"{settings.API_V1_STR}/voice", tags=["Voice AI"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["System Control"])
app.include_router(website.router, prefix=f"{settings.API_V1_STR}/website", tags=["Website Bridge"])
app.include_router(memory.router, prefix=f"{settings.API_V1_STR}/memory", tags=["Assistant Memory"])
app.include_router(whatsapp.router, prefix=f"{settings.API_V1_STR}/whatsapp", tags=["WhatsApp"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["Projects"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(meetings.router, prefix=f"{settings.API_V1_STR}/meetings", tags=["Meetings AI"])
app.include_router(training.router, prefix=f"{settings.API_V1_STR}/training", tags=["Training Center"])


@app.on_event("startup")
def warm_engines():
    """
    Background-load the heavy engines at boot (Whisper STT + preferred
    Ollama model) so the first voice command answers in seconds, not minutes.
    """
    import os
    # Tests spin the app up dozens of times — don't download/load models there
    if os.getenv("PYTEST_CURRENT_TEST") or os.getenv("VIXCELL_SKIP_WARMUP"):
        return
    from app.services import voice_engine, ai_engine, system_control
    voice_engine.preload_model_async()
    ai_engine.warm_preferred_model_async()
    # App catalog scan (Get-StartApps) takes a couple of seconds — do it now
    # so the first "افتحلي ..." answers instantly
    import threading
    threading.Thread(target=lambda: system_control.list_apps(),
                     daemon=True, name="apps-scan").start()


@app.get("/health")
def health_check():
    """
    Service health check endpoint. Exposes resolved storage paths so
    misconfigured storage (e.g. falling back to C:) is immediately visible.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": "connected",
        "storage_root": settings.STORAGE_ROOT,
        "db_path": settings.DB_PATH,
    }
