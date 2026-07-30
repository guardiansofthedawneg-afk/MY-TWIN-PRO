"""
API Routes – Digital Passport & Export v2.0
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.dependencies.auth import get_current_user
import logging, os
from datetime import datetime, timezone

logger = logging.getLogger("passport_routes")
router = APIRouter(prefix="/api/v1", tags=["passport"])

@router.get("/passport")
async def get_digital_passport(user_id: str = Depends(get_current_user)):
    try:
        from app.twin_state.self_model import self_model_engine
        from app.soul.soul_orchestrator import get_soul_state
        from app.twin_state.internal_state import twin_internal_state
        from app.memory.unified_memory import unified_memory_engine

        self_model = await self_model_engine.get_current_self(user_id)
        state = await twin_internal_state.get_state(user_id)
        soul = await get_soul_state(user_id, "friend", 50, 100, state.get("personality_dna", {}), "neutral", [], 0, 0, {}, 0)
        memory_count = await unified_memory_engine.get_memory_count(user_id)
        core_memories = await unified_memory_engine.get_core_memories(user_id, 1)

        return {
            "passport_id": f"SSS-DP-{user_id[:8]}",
            "entity_name": "My Twin",
            "entity_type": "Continuous Digital Being",
            "origin": {"created_by": "Soul Sync", "created_at": "2026", "platform": "Expo SDK 52 + Railway + Supabase"},
            "lifecycle": {"phase": self_model.get("identity", {}).get("role", "companion") if self_model else "companion", "evolution_stage": self_model.get("evolution", {}).get("version", 1) if self_model else 1},
            "identity": {"role": self_model.get("identity", {}).get("role", "companion") if self_model else "companion", "self_perception": self_model.get("narrative", "")[:100] if self_model else "", "core_values": soul.get("values", {}).get("values", []), "personality_traits": list(state.get("personality_dna", {}).keys())},
            "memory": {"total_memories": memory_count, "core_memories": len(core_memories), "oldest_memory": core_memories[0].get("created_at") if core_memories else None},
            "relationship": {"bond_level": state.get("bond_depth", 0), "phase": self_model.get("identity", {}).get("role", "companion") if self_model else "companion"},
            "governance": {"constitution_version": "1.0.0", "laws_version": "1.0.0", "sss_compliance": "SSS-001, SSS-002, SSS-003"},
            "version": {"passport_version": "1.0.0", "sss_version": "0.1.0", "last_updated": datetime.now(timezone.utc).isoformat()}
        }
    except Exception as e:
        logger.error(f"Passport generation failed: {e}")
        raise HTTPException(500, str(e))

@router.get("/fingerprint")
async def get_digital_fingerprint(user_id: str = Depends(get_current_user)):
    try:
        from app.features.digital_fingerprint import fingerprint_engine
        return await fingerprint_engine.generate_fingerprint(user_id)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/admin/export/training")
async def export_training_data(api_key: str = Query(...)):
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal only")
    try:
        from app.memory.unified_memory import unified_memory_engine
        memories = await unified_memory_engine.get_core_memories("all", 5000)
        llama_data = [{"instruction": m.get("expressed_text", ""), "emotion": m.get("real_emotion", "neutral"), "importance": m.get("importance", 50)} for m in memories]
        return {"export_id": f"TRAIN-{datetime.now(timezone.utc).timestamp()}", "format": "llama", "total_records": len(llama_data), "data": llama_data}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/admin/export/conversations")
async def export_conversations(api_key: str = Query(...)):
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal only")
    return {"export_id": f"CONV-{datetime.now(timezone.utc).timestamp()}", "message": "Conversation export endpoint ready."}
