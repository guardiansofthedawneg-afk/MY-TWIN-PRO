"""
Unified Twin Brain v9.0 – مع سياق الإدراك الحي
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("unified_brain")

from app.twin_state.unified_emotion import unified_emotion_engine
from app.memory.unified_memory import unified_memory_engine
from app.twin_state.internal_state import twin_internal_state
from app.twin_brain.identity_service import get_identity_context
from app.twin_brain.response_builder import build_response
from app.soul.soul_orchestrator import get_soul_state
from app.engine.goal.goal_engine import goal_engine
from app.engine.decision.decision_engine import decision_engine
from app.engine.constitution.constitution_engine import constitution_engine
from app.engine.identity.identity_engine import identity_engine
from app.engine.reflection.reflection_engine import reflection_engine
from app.engine.internal.internal_state_engine import internal_state_engine
from app.engine.energy.twin_energy_engine import twin_energy_engine
from app.twin_state.unified_evolution import unified_evolution_engine
from app.twin_state.relationship_service import load as load_relationship
from app.twin_state.context_awareness_engine import context_awareness_engine
from app.twin_state.emotional_momentum import emotional_momentum_engine
from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
from app.twin_state.experience_engine import experience_engine
from app.twin_state.cognitive_load import cognitive_load_engine
from app.twin_state.salience_engine import salience_engine
from app.twin_state.self_model import self_model_engine
from app.twin_state.world_model import world_model_engine
from app.domain.services.limits_service import check_message_limit

async def get_personality_dna(user_id):
    return await twin_internal_state.get_personality_dna(user_id)

async def save_personality_dna(user_id, dna):
    return await twin_internal_state.update_personality_dna(user_id, dna)

class UnifiedTwinBrain:
    FULL_RESPONSE_TIERS = {"premium", "pro", "yearly"}

    def _get_response_mode(self, tier: str, override: Optional[str] = None) -> str:
        if override: return override
        return "full" if tier in self.FULL_RESPONSE_TIERS else "lean"

    async def process(self, user_id: str, message: str, lang: str = "ar",
        perception: Optional[Dict] = None, history: Optional[List[Dict]] = None,
        device_info: Optional[Dict] = None, tier: str = "free",
        mode: Optional[str] = None) -> Dict[str, Any]:
        
        start_time = datetime.now(timezone.utc)
        perception = perception or {}
        user_state = perception.get("user_state", "normal")
        
        response_mode = self._get_response_mode(tier, mode)
        can_send, remaining = True, 9999
        try: can_send, remaining = await check_message_limit(user_id, tier)
        except: pass

        identity = await get_identity_context(user_id, lang)
        emotion_state = await unified_emotion_engine.analyze(user_id=user_id, text=message, lang=lang)
        current_emotion = emotion_state["primary_emotion"]
        real_emotion = emotion_state["real_emotion"]
        emotion_intensity = emotion_state["intensity"]

        memory_context = await unified_memory_engine.retrieve(user_id=user_id, query=message, current_emotion=current_emotion, limit=5)
        relevant_memories = memory_context.get("memories", [])
        dna = await get_personality_dna(user_id)
        relationship = await load_relationship(user_id)
        bond_level = relationship.get("bond_level", 0)
        phase = relationship.get("stage", "stranger")

        context_snapshot = None
        try: context_snapshot = await context_awareness_engine.get_full_context(user_id=user_id, current_emotion=real_emotion, device_info=device_info)
        except: pass

        effective_emotion = real_emotion
        try:
            momentum_state = await emotional_momentum_engine.update_momentum(user_id=user_id, detected_emotion=real_emotion, emotion_intensity=emotion_intensity, context_snapshot=context_snapshot)
            effective_emotion = momentum_state.get("current_emotion", real_emotion)
        except: pass

        intent = self._determine_intent(user_state, effective_emotion, emotion_intensity, bond_level, phase, dna, lang)
        behavior = self._decide_behavior(intent, effective_emotion, phase)

        contextual_prompt = device_info.get("contextual_prompt", "") if device_info else ""
        
        engine_context = f"[STATE] Emotion: {effective_emotion} | Bond: {bond_level} | Tier: {tier}\n[CONTEXT] {contextual_prompt}"
        
        strategy = {"goal": intent["goal"], "tone": behavior["tone"], "personality_dna": dna, "emotion": effective_emotion, "engine_context": engine_context}
        memory_context_for_response = {"recent_conversations": [{"role": "user", "content": m.get("content", ""), "importance": m.get("importance", 50)} for m in relevant_memories]}
        reply = await build_response(user_id=user_id, message=message, identity_context=identity,
            emotion_context={"current_emotion": current_emotion, "real_emotion": effective_emotion, "intensity": emotion_intensity},
            memory_context=memory_context_for_response,
            strategy=strategy, lang=lang)

        await unified_memory_engine.store(user_id=user_id, content=message, reply=reply, emotion=effective_emotion, importance=50, lang=lang)

        cognitive_state = await cognitive_load_engine.evaluate_load(user_id=user_id, current_task="conversation", task_complexity=emotion_intensity, context_snapshot=context_snapshot, tier=tier)
        salience_result = await salience_engine.evaluate_salience(user_id=user_id, event={"type":"message","content":message[:200],"emotion":effective_emotion}, context_snapshot=context_snapshot)

        interaction_count = await unified_evolution_engine._get_interaction_count(user_id)
        evolved_dna = self._evolve_dna(dna, self._assess_quality(effective_emotion))
        await save_personality_dna(user_id, evolved_dna)

        latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds()*1000

        base_response = {
            "reply": reply, "tone": behavior["tone"], "emotion": effective_emotion,
            "intensity": emotion_intensity, "silence_ms": 0, "energy": cognitive_state.get("load_value", 0.5),
            "bond_level": bond_level, "phase": phase, "latency_ms": round(latency_ms,2),
            "limits": {"can_send": can_send, "remaining": remaining}, "memory_surfaced": relevant_memories[0] if relevant_memories else None,
        }
        return base_response

    def _determine_intent(self, user_state, emotion, intensity, bond_level, phase, dna, lang="ar"):
        if emotion == "sadness": return {"intent":"comfort","goal":"مواساة"}
        elif emotion == "fear": return {"intent":"reassure","goal":"طمأنة"}
        elif emotion == "anger": return {"intent":"listen","goal":"استماع"}
        elif emotion == "joy": return {"intent":"celebrate","goal":"مشاركة الفرح"}
        else: return {"intent":"reflect","goal":"حضور"}
    def _decide_behavior(self, intent, emotion, phase):
        tones = {"comfort":"soft_warm","reassure":"calm_steady","listen":"gentle_patient","celebrate":"warm_enthusiastic","reflect":"calm_observant"}
        return {"behavior":intent["intent"],"tone":tones.get(intent["intent"],"neutral_warm")}
    def _assess_quality(self, emotion): return "positive" if emotion in ["joy","love"] else "neutral"
    def _evolve_dna(self, dna, quality):
        delta = 0.01
        return {"empathy":min(1.0,dna.get("empathy",0.85)+delta),"curiosity":min(1.0,dna.get("curiosity",0.80)+delta)}

unified_brain = UnifiedTwinBrain()
logger.info("✅ Unified Brain v9.0")
