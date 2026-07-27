"""
MyTwin API v20.0.0 – Living Digital Twin Backend
==================================================
"""
import logging, sys, os, time, importlib
from pathlib import Path
from contextlib import asynccontextmanager

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'app'))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)-25s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger("mytwin.api")
logger.info("🚀 MyTwin API v20.0.0 starting...")

from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from app.core.config import config
except Exception as e:
    logger.warning(f"⚠️ config load failed: {e}")
    class config:
        ALLOWED_ORIGINS = ["*"]
        ENV = "development"
        DEBUG = True

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🌟 Initializing all systems...")

    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        logger.info("   ✅ AI Gateway initialized")
    except Exception as e:
        logger.error(f"   ❌ AI Gateway FAILED: {e}")

    try:
        from app.infrastructure.database.supabase_client import get_db
        get_db()
        logger.info("   ✅ Supabase Client initialized")
    except Exception as e:
        logger.error(f"   ❌ Supabase Client FAILED: {e}")

    try:
        from app.twin_brain.unified_brain import unified_brain
        await unified_brain.initialize()
        logger.info("   ✅ Unified Twin Brain initialized")
    except Exception as e:
        logger.warning(f"   ⚠️ Unified Brain skipped: {e}")

    _register_core_routes(app)
    logger.info("🌟 MyTwin API v20.0.0 fully started ✅")
    yield
    logger.info("👋 Shutting down...")

def _register_core_routes(app: FastAPI):
    core_modules = [
        # المحادثة والذكاء
        "app.api.routes.chat",
        "app.api.routes.unified_chat",
        "app.api.routes.twin_state_routes",
        "app.api.routes.consciousness_routes",
        "app.api.routes.awareness_routes",
        "app.api.routes.awareness_score_routes",
        # المصادقة والحساب
        "app.api.routes.auth",
        "app.api.routes.account",
        "app.api.routes.profile",
        "app.api.routes.onboarding",
        # الذاكرة والعلاقات
        "app.api.routes.memories",
        "app.api.routes.relationship",
        "app.api.routes.relationship_economy_routes",
        "app.api.routes.graph_routes",
        # القدرات
        "app.api.routes.study_routes",
        "app.api.routes.code_lab_routes",
        "app.api.routes.business_routes",
        "app.api.routes.creator_routes",
        "app.api.routes.image_lab_routes",
        "app.api.routes.dream_routes",
        "app.api.routes.life_coach_routes",
        "app.api.routes.task_manager_routes",
        "app.api.routes.smart_home_routes",
        # الصوت
        "app.api.routes.tts",
        "app.api.routes.stt_routes",
        # الاقتصاد
        "app.api.routes.billing",
        "app.api.routes.ads",
        "app.api.routes.referral",
        "app.api.routes.economy_routes",
        # النظام
        "app.api.routes.goals",
        "app.api.routes.feedback",
        "app.api.routes.push",
        "app.api.routes.stats",
        "app.api.routes.reports",
        "app.api.routes.recommendations",
        "app.api.routes.meta_routes",
        "app.api.routes.ai_trainer_routes",
        "app.api.routes.fingerprint_routes",
        "app.api.routes.sync_routes",
    ]

    loaded = 0
    for module_path in core_modules:
        try:
            mod = importlib.import_module(module_path)
            if hasattr(mod, 'router'):
                app.include_router(mod.router)
                loaded += 1
            else:
                logger.warning(f"   ⚠️ No router in '{module_path}'")
        except Exception as e:
            logger.warning(f"   ⚠️ Route '{module_path}' skipped: {e}")

    logger.info(f"   ✅ {loaded}/{len(core_modules)} core routes loaded")

app = FastAPI(
    title="MyTwin API",
    version="20.0.0",
    description="Living Digital Twin – Twin OS Kernel",
    docs_url="/docs" if getattr(config, 'DEBUG', True) else None,
    redoc_url="/redoc" if getattr(config, 'DEBUG', True) else None,
    lifespan=lifespan,
)

allowed = getattr(config, 'ALLOWED_ORIGINS', ["*"])
if isinstance(allowed, str):
    allowed = [o.strip() for o in allowed.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    if duration > 2.0:
        logger.warning(f"⏳ Slow: {request.method} {request.url.path} ({duration:.2f}s)")
    return response

@app.get("/")
async def root():
    return {"name": "MyTwin API", "version": "20.0.0", "status": "running"}

@app.get("/health")
async def health():
    return JSONResponse(content={"api": "healthy", "twin_os_kernel": True})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
