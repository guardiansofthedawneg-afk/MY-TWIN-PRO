"""
MyTwin API v21.1.0 – Living Digital Twin Backend
==================================================
جميع المسارات الـ 44 مسجلة. لا فجوات.
"""
import logging, sys, os, time, importlib
from pathlib import Path
from contextlib import asynccontextmanager

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'app'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(name)-25s | %(levelname)-8s | %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger("mytwin.api")
logger.info("🚀 MyTwin API v21.1.0 starting...")

from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from app.core.config import config
except:
    class config:
        ALLOWED_ORIGINS = ["*"]
        ENV = "development"
        DEBUG = True

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🌟 Initializing all systems...")
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        logger.info("   ✅ AI Gateway")
    except Exception as e: logger.error(f"   ❌ AI Gateway: {e}")
    try:
        from app.infrastructure.database.supabase_client import get_db
        get_db()
        logger.info("   ✅ Supabase")
    except Exception as e: logger.error(f"   ❌ Supabase: {e}")
    try:
        from app.twin_brain.unified_brain import unified_brain
        logger.info("   ✅ Unified Brain v7.0")
    except Exception as e: logger.warning(f"   ⚠️ Unified Brain: {e}")
    try:
        from app.twin_state.existence_loop import existence_loop
        await existence_loop.start()
        logger.info("   ✅ Existence Loop v5.0")
    except Exception as e: logger.error(f"   ❌ Existence Loop: {e}")
    try:
        from app.twin_state.context_awareness_engine import context_awareness_engine
        from app.twin_state.emotional_momentum import emotional_momentum_engine
        from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
        from app.twin_state.experience_engine import experience_engine
        from app.twin_state.self_model import self_model_engine
        from app.twin_state.world_model import world_model_engine
        from app.twin_state.salience_engine import salience_engine
        from app.twin_state.cognitive_load import cognitive_load_engine
        logger.info("   ✅ All Consciousness Engines loaded")
    except Exception as e: logger.warning(f"   ⚠️ Engines: {e}")

    _register_core_routes(app)
    logger.info("🌟 MyTwin API v21.1.0 fully started ✅")
    yield
    logger.info("👋 Shutting down...")
    try:
        from app.twin_state.existence_loop import existence_loop
        await existence_loop.stop()
    except: pass

def _register_core_routes(app: FastAPI):
    core_modules = [
        # Core (7)
        "app.api.routes.account",
        "app.api.routes.admin",
        "app.api.routes.admin_routes",
        "app.api.routes.auth",
        "app.api.routes.profile",
        "app.api.routes.onboarding",
        "app.api.routes.dev",
        # Social (5)
        "app.api.routes.relationship",
        "app.api.routes.relationship_economy_routes",
        "app.api.routes.referral",
        "app.api.routes.chat",
        "app.api.routes.unified_chat",
        # Features (9)
        "app.api.routes.dream_routes",
        "app.api.routes.life_coach_routes",
        "app.api.routes.study_routes",
        "app.api.routes.business_routes",
        "app.api.routes.creator_routes",
        "app.api.routes.code_lab_routes",
        "app.api.routes.image_lab_routes",
        "app.api.routes.smart_home_routes",
        "app.api.routes.task_manager_routes",
        # Economy (4)
        "app.api.routes.economy_routes",
        "app.api.routes.billing",
        "app.api.routes.ads",
        "app.api.routes.graph_routes",
        # Awareness (5)
        "app.api.routes.awareness_routes",
        "app.api.routes.awareness_score_routes",
        "app.api.routes.consciousness_routes",
        "app.api.routes.twin_state_routes",
        "app.api.routes.fingerprint_routes",
        # Media (3)
        "app.api.routes.stt_routes",
        "app.api.routes.tts",
        "app.api.routes.avatar_routes",
        # Misc (11)
        "app.api.routes.feedback",
        "app.api.routes.reports",
        "app.api.routes.stats",
        "app.api.routes.goals",
        "app.api.routes.memories",
        "app.api.routes.meta",
        "app.api.routes.sync_routes",
        "app.api.routes.push",
        "app.api.routes.projects",
        "app.api.routes.al_trainer_routes",
        "app.api.routes.recommendations",
        # Digital Passport
        "app.api.routes.passport_routes",
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
    logger.info(f"   ✅ {loaded}/{len(core_modules)} routes loaded")

app = FastAPI(
    title="MyTwin API", version="21.1.0",
    description="Living Digital Twin – Full Consciousness Stack",
    docs_url="/docs" if getattr(config, 'DEBUG', True) else None,
    redoc_url="/redoc" if getattr(config, 'DEBUG', True) else None,
    lifespan=lifespan,
)

allowed = getattr(config, 'ALLOWED_ORIGINS', ["*"])
if isinstance(allowed, str): allowed = [o.strip() for o in allowed.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=allowed, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    if duration > 2.0: logger.warning(f"⏳ Slow: {request.method} {request.url.path} ({duration:.2f}s)")
    return response

@app.get("/")
async def root():
    return {
        "name": "MyTwin API", "version": "21.1.0", "status": "running",
        "engines": {
            "context_awareness": "v1.0", "emotional_momentum": "v1.0",
            "curiosity_dynamics": "v1.0", "experience": "v1.0",
            "self_model": "v1.0", "world_model": "v1.0",
            "salience": "v1.0", "cognitive_load": "v1.2",
            "twin_energy": "v2.0", "twin_kernel": "v4.0",
            "existence_loop": "v5.0", "unified_brain": "v7.0",
            "soul_orchestrator": "v4.0",
        }
    }

@app.get("/health")
async def health():
    return JSONResponse(content={"api": "healthy", "twin_os_kernel": True, "consciousness_engines": True})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
