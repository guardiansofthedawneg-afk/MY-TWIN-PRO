"""
SoulOrchestrator v1.0 – المنسق الرئيسي للروح
=================================================
يُعيد حالة روح كاملة ويُدير التطور.
يُستدعى من unified_brain.py.
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
    """تجميع حالة الروح الكاملة"""
    role = await soul_core.get_role(relationship_stage)
    labels = soul_core.get_labels(role)
    phase = await soul_core.evolve_phase(role, bond_level, interaction_count)

    values = await soul_values.update_values(
        ["التعاطف", "الفضول", "الصدق"],
        recent_emotions,
        memory_patterns,
    )
    traits = await soul_traits.derive(personality_dna, dominant_emotion)
    resonance = await soul_resonance.calculate(
        bond_level, memory_count, core_memory_count,
        dominant_emotion, personality_dna, interaction_count,
    )
    signature = await soul_signature.generate(
        user_id, values, traits, role,
        resonance["harmony"], evolution_count,
    )
    milestones = await soul_timeline.record_evolution(evolution_count)
    timeline = await soul_timeline.get_life_story()

    return {
        "core": {
            "role": role,
            "phase": phase,
            "labels": labels,
        },
        "values": {
            "values": values,
            "conflicts": await soul_values.get_value_conflicts(values),
        },
        "traits": {
            "traits": traits,
        },
        "resonance": resonance,
        "signature": {
            "fingerprint": signature,
            "uniqueness": await soul_signature.get_uniqueness_score(signature),
        },
        "timeline": timeline,
    }


async def evolve_soul(
    user_id: str,
    interaction_quality: str,
    new_emotion: str,
    new_dna: Dict[str, float],
    evolution_count: int,
) -> Dict[str, Any]:
    """تطوير الروح بعد تفاعل"""
    new_milestones = await soul_timeline.record_evolution(evolution_count + 1)
    return {
        "evolution_count": evolution_count + 1,
        "new_milestones": new_milestones,
    }
