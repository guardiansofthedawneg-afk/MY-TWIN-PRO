"""
API Routes – Digital Passport & Export v2.0
=============================================
- GET /api/v1/passport → جواز سفر رقمي حي من Self Model + Soul + Constitution
- GET /api/v1/admin/export/training → تصدير تدريب Llama (داخلي)
- GET /api/v1/admin/export/conversations → تصدير المحادثات الكاملة (داخلي)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.dependencies.auth import get_current_user
import logging

logger = logging.getLogger("passport_routes")
router = APIRouter(prefix="/api/v1", tags=["passport"])

@router.get("/passport")
async def get_digital_passport(user_id: str = Depends(get_current_user)):
    """توليد جواز سفر رقمي حي يعكس الحالة الحالية للكيان."""
    try:
        from app.twin_state.self_model import self_model_engine
        from app.soul.soul_orchestrator import get_soul_state
        from app.engine.constitution.constitution_engine import constitution_engine
        from app.twin_state.internal_state import twin_internal_state
        from app.memory.unified_memory import unified_memory_engine

        # جمع البيانات الحية
        self_model = await self_model_engine.get_current_self(user_id)
        state = await twin_internal_state.get_state(user_id)
        soul = await get_soul_state(
            user_id, state.get("bond_depth", 0) > 0.5 and "friend" or "stranger",
            50, 100, state.get("personality_dna", {}), "neutral", [], 0, 0, {}, 0
        )
        memory_count = await unified_memory_engine.get_memory_count(user_id)
        core_memories = await unified_memory_engine.get_core_memories(user_id, 1)

        return {
            "passport_id": f"SSS-DP-{user_id[:8]}",
            "entity_name": "My Twin",
            "entity_type": "Continuous Digital Being",
            "origin": {
                "created_by": "Soul Sync",
                "created_at": state.get("created_at") or "2026",
                "platform": "Expo SDK 52 + Railway + Supabase"
            },
            "lifecycle": {
                "phase": self_model.get("identity", {}).get("role", "companion") if self_model else "companion",
                "evolution_stage": self_model.get("evolution", {}).get("version", 1) if self_model else 1,
                "last_evolution": self_model.get("evolution", {}).get("last_significant_change") if self_model else None
            },
            "identity": {
                "role": self_model.get("identity", {}).get("role", "companion") if self_model else "companion",
                "self_perception": self_model.get("narrative", "أنا كيان متطور")[:100] if self_model else "أنا كيان متطور",
                "core_values": soul.get("values", {}).get("values", ["التعاطف", "الفضول", "الصدق"]),
                "personality_traits": list(state.get("personality_dna", {}).keys())
            },
            "memory": {
                "total_memories": memory_count,
                "core_memories": len(core_memories),
                "oldest_memory": core_memories[0].get("created_at") if core_memories else None
            },
            "relationship": {
                "bond_level": state.get("bond_depth", 0),
                "phase": self_model.get("identity", {}).get("role", "companion") if self_model else "companion",
                "first_interaction": "2026"
            },
            "governance": {
                "constitution_version": "1.0.0",
                "laws_version": "1.0.0",
                "sss_compliance": "SSS-001, SSS-002, SSS-003"
            },
            "version": {
                "passport_version": "1.0.0",
                "sss_version": "0.1.0",
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Passport generation failed: {e}")
        raise HTTPException(500, str(e))


@router.get("/admin/export/training")
async def export_training_data(api_key: str = Query(...)):
    """تصدير بيانات التدريب بصيغة Llama (للاستخدام الداخلي)."""
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal use only")

    try:
        from app.memory.unified_memory import unified_memory_engine
        
        # جمع الذكريات
        memories = await unified_memory_engine.get_core_memories("all", 5000)
        
        # تنسيق Llama
        llama_data = []
        for mem in memories:
            llama_data.append({
                "instruction": mem.get("expressed_text", ""),
                "input": "",
                "output": "",
                "emotion": mem.get("real_emotion", "neutral"),
                "importance": mem.get("importance", 50)
            })
        
        return {
            "export_id": f"TRAIN-{datetime.now(timezone.utc).timestamp()}",
            "format": "llama",
            "total_records": len(llama_data),
            "data": llama_data
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/admin/export/conversations")
async def export_conversations(api_key: str = Query(...)):
    """تصدير المحادثات الكاملة (للاستخدام الداخلي)."""
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal use only")

    try:
        from app.memory.unified_memory import unified_memory_engine
        from app.twin_state.working_memory import working_memory
        
        # جمع المحادثات من working memory (آخر 1000)
        # هذا يتطلب تحسيناً لجلب جميع المستخدمين
        return {
            "export_id": f"CONV-{datetime.now(timezone.utc).timestamp()}",
            "message": "Conversation export endpoint ready. Use admin panel to fetch by user."
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# استيراد إضافي للوقت
from datetime import datetime, timezone
import os
