"""
API Routes – Digital Passport & Digital Fingerprint
======================================================
- GET /api/v1/passport → توليد جواز السفر الرقمي
- GET /api/v1/fingerprint → البصمة الرقمية
- GET /api/v1/export/training → تصدير بيانات التدريب (داخلي)
"""
from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["passport"])

@router.get("/passport")
async def get_digital_passport(user_id: str = Depends(get_current_user)):
    try:
        from app.twin_state.self_model import self_model_engine
        from app.soul.soul_orchestrator import get_soul_state
        from app.twin_state.internal_state import twin_internal_state
        
        self_model = await self_model_engine.get_current_self(user_id)
        soul = await get_soul_state(user_id, "friend", 50, 100, {}, "neutral", [], 0, 0, {}, 0)
        state = await twin_internal_state.get_state(user_id)
        
        return {
            "passport_id": f"SSS-DP-{user_id[:8]}",
            "entity_name": "My Twin",
            "identity": self_model.get("identity", {}) if self_model else {},
            "soul": soul.get("core", {}),
            "evolution": self_model.get("evolution", {}) if self_model else {},
            "version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/fingerprint")
async def get_digital_fingerprint(user_id: str = Depends(get_current_user)):
    try:
        from app.features.digital_fingerprint import fingerprint_engine
        return await fingerprint_engine.generate_fingerprint(user_id)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/export/training")
async def export_training_data(api_key: str):
    if api_key != "SOUL_SYNC_INTERNAL_KEY":
        raise HTTPException(403, "Internal only")
    try:
        from app.memory.unified_memory import unified_memory_engine
        memories = await unified_memory_engine.get_core_memories("all", 5000)
        return {"total": len(memories), "data": memories}
    except Exception as e:
        raise HTTPException(500, str(e))
