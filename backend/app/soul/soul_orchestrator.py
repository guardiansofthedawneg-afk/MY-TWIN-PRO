"""
SoulOrchestrator v3.0 – منسق الروح مع محركات P1
==================================================
يدمج Self Model و World Model في حالة الروح.
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("soul_orchestrator")

from app.soul.soul_core import SoulCore
from app.soul.soul_values import SoulValues
from app.soul.soul_resonance import SoulResonance
from app.soul.soul_signature import SoulSignature
from app.soul.soul_traits import SoulTraits
from app.soul.soul_timeline import SoulTimeline
from app.soul.soul_evolution import SoulEvolution
from app.soul.soul_bonds import SoulBonds

soul_core = SoulCore()
soul_values = SoulValues()
soul_resonance = SoulResonance()
soul_signature = SoulSignature()
soul_traits = SoulTraits()
soul_timeline = SoulTimeline()
soul_evolution = SoulEvolution()
soul_bonds = SoulBonds()

async def get_soul_state(
    user_id: str,
    relationship_stage: str,
    bond_level: int,
    interaction_count: int,
    personality_dna: Dict[str, float],
    dominant_emotion: str,
    recent_emotions: list,
    memory_count: int,
    core_memory_count: int,
    memory_patterns: Dict[str, float],
    evolution_count: int,
    lang: str = "ar",
) -> Dict[str, Any]:
    role = await soul_core.get_role(relationship_stage)
    labels = soul_core.get_labels(role)
    phase = await soul_core.evolve_phase(role, bond_level, interaction_count)
    values = await soul_values.update_values(["التعاطف", "الفضول", "الصدق"], recent_emotions, memory_patterns)
    traits = await soul_traits.derive(personality_dna, dominant_emotion)
    resonance = await soul_resonance.calculate(bond_level, memory_count, core_memory_count, dominant_emotion, personality_dna, interaction_count)
    signature = await soul_signature.generate(user_id, values, traits, role, resonance["harmony"], evolution_count)
    timeline = await soul_timeline.get_life_story()

    # دمج P1
    context_state = curiosity_state = momentum_state = recent_experiences = None
    self_model = world_snapshot = None

    try:
        from app.twin_state.context_awareness_engine import context_awareness_engine
        context_state = await context_awareness_engine.get_current_context(user_id)
    except: pass
    try:
        from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
        curiosity_state = await curiosity_dynamics_engine.get_curiosity_state(user_id)
    except: pass
    try:
        from app.twin_state.emotional_momentum import emotional_momentum_engine
        momentum_state = await emotional_momentum_engine.get_momentum_state(user_id)
    except: pass
    try:
        from app.twin_state.experience_engine import experience_engine
        recent_experiences = await experience_engine.get_recent_experiences(user_id, limit=5)
    except: pass
    try:
        from app.twin_state.self_model import self_model_engine
        self_model = await self_model_engine.get_current_self(user_id)
    except: pass
    try:
        from app.twin_state.world_model import world_model_engine
        world_snapshot = await world_model_engine.get_world_snapshot(user_id)
    except: pass

    result = {
        "core": {"role": role, "phase": phase, "labels": labels},
        "values": {"values": values, "conflicts": await soul_values.get_value_conflicts(values)},
        "traits": {"traits": traits},
        "resonance": resonance,
        "signature": {"fingerprint": signature, "uniqueness": await soul_signature.get_uniqueness_score(signature)},
        "timeline": timeline,
    }
    if context_state:
        result["context"] = {"time_of_day": context_state.get("time", {}).get("time_of_day"), "session_type": context_state.get("session", {}).get("session_type"), "recommended_tone": context_state.get("composite", {}).get("recommended_tone")}
    if curiosity_state:
        result["curiosity"] = curiosity_state
    if momentum_state:
        result["emotional_momentum"] = {"current_emotion": momentum_state.get("current_emotion"), "phase": momentum_state.get("phase"), "requires_silence": momentum_state.get("requires_silence", False)}
    if recent_experiences:
        result["recent_experiences"] = [{"type": e["type"], "intensity": e["intensity"], "timestamp": e["timestamp"]} for e in recent_experiences[:3]]
    if self_model:
        result["self_model"] = {"role": self_model["identity"]["role"], "maturity": self_model["identity"]["maturity"], "narrative": self_model["narrative"][:100]}
    if world_snapshot:
        result["world_model"] = {"entities": world_snapshot["entities"], "top_persons": world_snapshot.get("top_persons", [])[:5]}

    return result

async def evolve_soul(user_id: str, interaction_quality: str, new_emotion: str, new_dna: Dict[str, float], evolution_count: int) -> Dict[str, Any]:
    new_milestones = await soul_timeline.record_evolution(evolution_count + 1)
    return {"evolution_count": evolution_count + 1, "new_milestones": new_milestones}

logger.info("✅ Soul Orchestrator v3.0 ready with P1")
