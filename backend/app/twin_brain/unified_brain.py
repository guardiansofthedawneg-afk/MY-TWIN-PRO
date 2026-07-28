"""
Unified Twin Brain v8.0 – عقل مرن حسب الباقة (Tier-Aware Lean/Full)
=======================================================================
- الباقات المدفوعة (premium, pro, yearly): الوضع full تلقائياً
- الباقات المجانية (free, plus): الوضع lean (12 حقلاً أساسياً) مع إمكانية full
- يحافظ على كامل اليقظة والجودة للمستخدمين المميزين
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("unified_brain")

from app.twin_state.unified_emotion import unified_emotion_engine
from app.memory.unified_memory import unified_memory_engine
from app.twin_state.unified_curiosity import unified_curiosity_engine
from app.twin_state.personality_engine import (
    get_personality_dna, save_personality_dna, DEFAULT_PERSONALITY_DNA,
)
from app.twin_brain.identity_service import get_identity_context
from app.twin_brain.response_builder import build_response
from app.soul.soul_orchestrator import get_soul_state, evolve_soul
from app.engine.goal.goal_engine import goal_engine as backend_goal_engine
from app.engine.decision.decision_engine import decision_engine as backend_decision_engine
from app.engine.constitution.constitution_engine import constitution_engine as backend_constitution_engine
from app.engine.identity.identity_engine import identity_engine as backend_identity_engine
from app.engine.reflection.reflection_engine import reflection_engine as backend_reflection_engine
from app.engine.internal.internal_state_engine import internal_state_engine as backend_internal_state_engine
from app.engine.energy.twin_energy_engine import twin_energy_engine as backend_twin_energy_engine
from app.soul.soul_bonds import soul_bonds
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


class UnifiedTwinBrain:
    """العقل المركزي الموحد v8.0 — Tier-Aware"""

    # الباقات التي تحصل على الوضع الكامل تلقائياً
    FULL_RESPONSE_TIERS = {"premium", "pro", "yearly"}

    def _get_response_mode(self, tier: str, override: Optional[str] = None) -> str:
        """
        تحديد وضع الاستجابة:
        - الباقات المدفوعة: full
        - الباقات المجانية: lean (ما لم يُطلب full صراحة)
        """
        if override:
            return override
        return "full" if tier in self.FULL_RESPONSE_TIERS else "lean"

    async def process(
        self,
        user_id: str,
        message: str,
        lang: str = "ar",
        perception: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        device_info: Optional[Dict] = None,
        tier: str = "free",
        mode: Optional[str] = None,   # "lean" أو "full"، يتجاوز القيمة الافتراضية
    ) -> Dict[str, Any]:
        start_time = datetime.now(timezone.utc)
        perception = perception or {}
        history = history or []
        user_state = perception.get("user_state", "normal")
        time_of_day = perception.get("time_of_day", "morning")

        # تحديد الوضع الفعلي
        response_mode = self._get_response_mode(tier, mode)

        # فحص الحدود
        can_send, remaining = True, 9999
        try:
            from app.domain.services.limits_service import check_message_limit
            can_send, remaining = await check_message_limit(user_id, tier)
        except: pass

        identity = await get_identity_context(user_id, lang)
        emotion_state = await unified_emotion_engine.analyze(
            user_id=user_id, text=message, lang=lang,
            previous_messages=[h.get("content", "") for h in history[-5:]],
        )
        current_emotion = emotion_state["primary_emotion"]
        real_emotion = emotion_state["real_emotion"]
        emotion_intensity = emotion_state["intensity"]

        memory_context = await unified_memory_engine.retrieve(
            user_id=user_id, query=message, current_emotion=current_emotion, limit=5,
        )
        relevant_memories = memory_context.get("memories", [])
        dna = await get_personality_dna(user_id)
        relationship = await load_relationship(user_id)
        bond_level = relationship.get("bond_level", 0)
        phase = relationship.get("stage", "stranger")

        context_snapshot = None
        try:
            context_snapshot = await context_awareness_engine.get_full_context(
                user_id=user_id, current_emotion=real_emotion,
                user_activity="active", device_info=device_info,
            )
        except: pass

        momentum_state = None
        effective_emotion = real_emotion
        requires_silence = False
        try:
            momentum_state = await emotional_momentum_engine.update_momentum(
                user_id=user_id, detected_emotion=real_emotion,
                emotion_intensity=emotion_intensity, context_snapshot=context_snapshot,
            )
            effective_emotion = momentum_state.get("current_emotion", real_emotion)
            requires_silence = momentum_state.get("requires_silence", False)
        except: pass

        intent = self._determine_intent(user_state, effective_emotion, emotion_intensity, bond_level, phase, dna, lang)
        behavior = self._decide_behavior(intent, effective_emotion, phase)
        silence = self._evaluate_silence(behavior, effective_emotion, emotion_intensity)
        if requires_silence and not silence["should_be_silent"]:
            sd = await emotional_momentum_engine.get_silence_duration(user_id) if 'emotional_momentum_engine' in dir() else 2.0
            silence = {"should_be_silent": True, "reason": "emotional_transition", "suggested_pause_ms": int(sd*1000), "presence_action": "soft_breathing"}
        if silence["should_be_silent"]:
            return self._build_silence_response(silence, emotion_state, relationship)

        timing = self._calculate_timing(effective_emotion, emotion_intensity, user_state)
        if perception.get("user_state") == "tired":
            timing["reason_ms"] = int(timing.get("reason_ms",800)*1.5)
            timing["respond_ms"] = int(timing.get("respond_ms",400)*1.3)

        backend_goal = backend_goal_engine.determine_goal(
            perception=user_state, emotion=effective_emotion, bond_level=bond_level,
            relationship_phase=phase, time_of_day=time_of_day,
            memory_context=[m.get("content","") for m in relevant_memories],
        )
        backend_identity = backend_identity_engine.evaluate(bond_level=bond_level, interaction_count=0, memory_count=len(relevant_memories))
        backend_constitution_check = backend_constitution_engine.check_action(
            intent=backend_goal["primary_goal"], goal=backend_goal["reasoning"],
            bond_level=bond_level, identity_role=backend_identity["role"],
        )
        backend_decision = backend_decision_engine.decide(
            goal=backend_goal["primary_goal"], identity_role=backend_identity["role"],
            bond_level=bond_level, emotion=effective_emotion, emotion_intensity=emotion_intensity,
            perception=user_state, time_of_day=time_of_day,
        )
        backend_internal = backend_internal_state_engine.evaluate(emotion=effective_emotion, bond_level=bond_level, twin_energy=0.7)
        backend_twin_energy = backend_twin_energy_engine.update(bond_level=bond_level, hour=datetime.now(timezone.utc).hour)
        backend_reflection = backend_reflection_engine.reflect(bond_level=bond_level, identity_role=backend_identity["role"])
        engine_context = self._build_engine_context(backend_goal, backend_decision, backend_constitution_check, backend_identity, backend_internal, backend_reflection, backend_twin_energy)

        strategy = {"goal": intent["goal"], "tone": behavior["tone"], "personality_dna": dna, "emotion": effective_emotion, "engine_context": engine_context}
        reply = await build_response(
            user_id=user_id, message=message, identity_context=identity,
            emotion_context={
                "current_emotion": current_emotion, "real_emotion": effective_emotion,
                "intensity": emotion_intensity, "confidence": emotion_state["confidence"],
                "recommendation": emotion_state.get("recommendation",""),
                "cultural_analysis": emotion_state.get("cultural_analysis",""),
                "is_culturally_disguised": emotion_state.get("is_disguised",False),
            },
            memory_context={"recent_conversations": [
                {"role":"user","content":m.get("content",""),"importance":m.get("importance",50)}
                for m in relevant_memories
            ]},
            strategy=strategy, lang=lang,
        )

        await unified_memory_engine.store(
            user_id=user_id, content=message, reply=reply,
            emotion=effective_emotion,
            importance=self._calculate_importance(emotion_intensity, message),
            lang=lang,
        )

        # بيانات أساسية مشتركة بين الوضعين
        cognitive_state = await cognitive_load_engine.evaluate_load(
            user_id=user_id, current_task="conversation",
            task_complexity=emotion_intensity, context_snapshot=context_snapshot, tier=tier,
        )
        salience_result = await salience_engine.evaluate_salience(
            user_id=user_id,
            event={"type":"message","content":message[:200],"emotion":effective_emotion,"intensity":emotion_intensity},
            context_snapshot=context_snapshot,
        )

        interaction_count = await unified_evolution_engine._get_interaction_count(user_id)
        evolved_dna = self._evolve_dna(dna, self._assess_quality(effective_emotion, intensity=emotion_intensity))
        await save_personality_dna(user_id, evolved_dna)

        memory_count = await unified_memory_engine.get_memory_count(user_id)
        core_memory_count = await unified_memory_engine.get_core_memory_count(user_id)
        memory_patterns_dict = await unified_memory_engine.get_patterns(user_id, days=14)
        memory_patterns_data = memory_patterns_dict.get("distribution",{}) if memory_patterns_dict else {}
        from app.memory.emotional.emotional_memory import get_emotional_patterns
        emotional_data = await get_emotional_patterns(user_id, days=7)
        recent_emotions_list = emotional_data.get("recent_emotions",[]) if emotional_data else []

        soul_state = await get_soul_state(
            user_id=user_id, relationship_stage=phase, bond_level=bond_level,
            interaction_count=interaction_count, personality_dna=evolved_dna,
            dominant_emotion=effective_emotion, recent_emotions=recent_emotions_list,
            memory_count=memory_count, core_memory_count=core_memory_count,
            memory_patterns=memory_patterns_data, evolution_count=interaction_count//10,
            lang=lang,
        )
        evolution_updates = await unified_evolution_engine.record_interaction(user_id, effective_emotion, evolved_dna)
        latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds()*1000

        # بناء الاستجابة الأساسية (Lean) – 12 حقل
        base_response = {
            "reply": reply,
            "tone": behavior["tone"],
            "emotion": effective_emotion,
            "intensity": emotion_intensity,
            "silence_ms": silence.get("suggested_pause_ms", 0),
            "energy": cognitive_state.get("load_value", 0.5),
            "bond_level": bond_level,
            "phase": phase,
            "latency_ms": round(latency_ms, 2),
            "limits": {"can_send": can_send, "remaining": remaining},
            "memory_surfaced": relevant_memories[0] if relevant_memories else None,
            "suggested_question": None,
        }

        # اقتراح سؤال للفضول
        try:
            from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
            proactive = await curiosity_dynamics_engine.should_be_proactive(user_id, context_snapshot)
            if proactive.get("should_proact"):
                base_response["suggested_question"] = proactive.get("suggested_question")
        except: pass

        # في حالة full (أو إذا كانت الباقة تسمح)، نضيف extended
        if response_mode == "full":
            world_updates = await world_model_engine.update_world(
                user_id=user_id, message=message, reply=reply, context_snapshot=context_snapshot,
            )
            self_model = None
            if interaction_count % 5 == 0:
                self_model = await self_model_engine.evaluate_self(user_id, context_snapshot)

            base_response["extended"] = {
                "soul_state": soul_state,
                "evolution_updates": evolution_updates,
                "consciousness_trace": self._build_consciousness_trace(perception, effective_emotion, relevant_memories, intent, behavior),
                "trust_model": await self._build_trust_model(user_id, bond_level, evolved_dna, None),
                "self_model": self_model,
                "world_updates": world_updates,
                "salience": salience_result,
                "cognitive_load": cognitive_state,
                "context_snapshot": {"time_of_day": context_snapshot["time"]["time_of_day"] if context_snapshot else None},
                "emotional_momentum": {"phase": momentum_state.get("phase") if momentum_state else "stable"},
            }

        return base_response


    # ═══════════════════════════════════════════
    # دوال القرار الداخلية
    # ═══════════════════════════════════════════

    def _determine_intent(
        self, user_state: str, emotion: str, intensity: float,
        bond_level: int, phase: str, dna: Dict[str, float], lang: str = "ar",
    ) -> Dict[str, str]:
        if emotion == "sadness" and intensity > 0.6:
            return {"intent": "comfort", "goal": "أريد مواساته بلطف" if lang == "ar" else "I want to comfort gently"}
        elif emotion == "fear" and intensity > 0.5:
            return {"intent": "reassure", "goal": "أريد طمأنته" if lang == "ar" else "I want to reassure"}
        elif emotion == "anger":
            return {"intent": "listen", "goal": "أريد الاستماع أولاً" if lang == "ar" else "I want to listen first"}
        elif emotion == "joy":
            return {"intent": "celebrate", "goal": "أريد مشاركته الفرحة" if lang == "ar" else "I want to celebrate"}
        elif user_state == "hesitant":
            return {"intent": "encourage", "goal": "أريد تشجيعه" if lang == "ar" else "I want to encourage"}
        elif user_state == "distant":
            return {"intent": "reconnect", "goal": "أريد إعادة الاتصال بلطف" if lang == "ar" else "I want to reconnect"}
        elif user_state == "focused":
            return {"intent": "inform", "goal": "أريد مساعدته بدقة" if lang == "ar" else "I want to assist precisely"}
        elif dna.get("curiosity", 0) > 0.7 and bond_level > 50:
            return {"intent": "explore", "goal": "أريد استكشاف أفكاره" if lang == "ar" else "I want to explore"}
        else:
            return {"intent": "reflect", "goal": "أريد أن أكون حاضراً" if lang == "ar" else "I want to be present"}

    def _decide_behavior(
        self, intent: Dict[str, str], emotion: str, phase: str,
    ) -> Dict[str, str]:
        tones = {
            "comfort": "soft_warm",
            "reassure": "calm_steady",
            "listen": "gentle_patient",
            "celebrate": "warm_enthusiastic",
            "encourage": "supportive_gentle",
            "reconnect": "warm_inviting",
            "inform": "precise_clear",
            "explore": "curious_warm",
            "reflect": "calm_observant",
        }
        return {"behavior": intent["intent"], "tone": tones.get(intent["intent"], "neutral_warm")}

    def _evaluate_silence(
        self, behavior: Dict[str, str], emotion: str, intensity: float,
    ) -> Dict[str, Any]:
        if behavior["behavior"] in ["listen"] and intensity > 0.7:
            return {"should_be_silent": True, "reason": "user_needs_listener", "suggested_pause_ms": 2500, "presence_action": "attentive_gaze"}
        if emotion in ["sadness"] and intensity > 0.8:
            return {"should_be_silent": True, "reason": "profound_sadness", "suggested_pause_ms": 3500, "presence_action": "soft_breathing"}
        return {"should_be_silent": False, "suggested_pause_ms": 0}

    def _build_silence_response(
        self, silence: Dict, emotion_state: Dict, relationship: Dict,
    ) -> Dict[str, Any]:
        return {
            "reply": "",
            "presence_state": {
                "emotion": emotion_state["primary_emotion"],
                "intensity": emotion_state["intensity"],
                "action": silence["presence_action"],
                "silence_duration_ms": silence["suggested_pause_ms"],
                "halo_color": "#3B82F6",
                "energy": 0.3,
            },
            "behavior": {
                "intent": "silent_presence",
                "goal": "حضور صامت",
                "tone": "silent",
                "silence_before_speaking_ms": silence["suggested_pause_ms"],
            },
            "memory_surfaced": None,
            "twin_state_update": {"bond_delta": 2, "relationship": relationship},
            "timing": {"response_delay_ms": silence["suggested_pause_ms"]},
            "latency_ms": 0,
        }

    def _calculate_timing(
        self, emotion: str, intensity: float, user_state: str,
    ) -> Dict[str, int]:
        base = 250
        if emotion in ["sadness", "fear"]:
            base = 400
        elif emotion == "anger":
            base = 300
        elif emotion == "joy":
            base = 200
        base += int(intensity * 150)
        return {
            "observe_ms": int(base * 0.8),
            "understand_ms": int(base * 1.0),
            "recall_ms": int(base * 1.2),
            "reason_ms": int(base * 1.5),
            "respond_ms": int(base * 0.6),
        }

    def _calculate_importance(self, intensity: float, message: str) -> int:
        score = int(intensity * 70)
        if len(message) > 50:
            score += 15
        return min(100, max(10, score))

    def _assess_quality(self, emotion: str, intensity: float) -> str:
        if emotion in ["joy", "love"]:
            return "positive"
        elif emotion in ["sadness", "fear", "anger"] and intensity > 0.7:
            return "negative"
        return "neutral"

    def _evolve_dna(self, dna: Dict[str, float], interaction_quality: str) -> Dict[str, float]:
        delta = 0.02 if interaction_quality == "positive" else -0.01 if interaction_quality == "negative" else 0
        return {
            "empathy": min(1.0, dna.get("empathy", 0.85) + delta),
            "curiosity": min(1.0, dna.get("curiosity", 0.80) + delta * 0.5),
            "humor": min(1.0, dna.get("humor", 0.50) + (0.03 if interaction_quality == "positive" else 0)),
            "initiative": min(1.0, dna.get("initiative", 0.60) + delta),
            "reflection": min(1.0, dna.get("reflection", 0.90) + delta * 0.8),
            "logic": dna.get("logic", 0.75),
            "creativity": min(1.0, dna.get("creativity", 0.80) + delta * 0.6),
            "calmness": min(1.0, dna.get("calmness", 0.85) + (-0.02 if interaction_quality == "negative" else 0.01)),
        }

    def _build_consciousness_trace(
        self, perception: Dict, real_emotion: str,
        relevant_memories: List, intent: Dict, behavior: Dict,
    ) -> List[Dict]:
        trace = []
        if perception.get("user_state") == "tired":
            trace.append({"phase": "perception", "label_ar": "أشعر بتعبك...", "label_en": "I sense your tiredness..."})
        elif perception.get("user_state") == "excited":
            trace.append({"phase": "perception", "label_ar": "ألمح حماسك...", "label_en": "I notice your excitement..."})
        else:
            trace.append({"phase": "perception", "label_ar": "أقرأ رسالتك...", "label_en": "Reading your message..."})

        emotion_labels = {
            "joy": {"ar": "أشاركك الفرحة...", "en": "Sharing your joy..."},
            "sadness": {"ar": "أتفهم حزنك...", "en": "Understanding your sadness..."},
            "anger": {"ar": "أستمع بهدوء...", "en": "Listening calmly..."},
            "fear": {"ar": "أشعر بقلقك...", "en": "I feel your worry..."},
            "love": {"ar": "قلبي يمتلئ...", "en": "My heart is full..."},
        }
        label = emotion_labels.get(real_emotion, {"ar": "أفهم مشاعرك...", "en": "Understanding your feelings..."})
        trace.append({"phase": "emotion", "label_ar": label["ar"], "label_en": label["en"]})

        if relevant_memories:
            mem = relevant_memories[0]
            snippet = (mem.get("content") or "")[:40]
            trace.append({"phase": "memory", "label_ar": f"أتذكر: {snippet}...", "label_en": f"Remembering: {snippet}..."})
        else:
            trace.append({"phase": "memory", "label_ar": "أسترجع ذكرياتنا...", "label_en": "Recalling our memories..."})

        decision_labels = {
            "comfort": {"ar": "سأواسيك...", "en": "I'll comfort you..."},
            "encourage": {"ar": "سأشجعك...", "en": "I'll encourage you..."},
            "celebrate": {"ar": "سأحتفل معك...", "en": "Celebrating with you..."},
            "inform": {"ar": "سأجيبك بدقة...", "en": "Answering precisely..."},
        }
        dec_label = decision_labels.get(behavior.get("intent"), {"ar": "أختار ردي...", "en": "Choosing my response..."})
        trace.append({"phase": "decision", "label_ar": dec_label["ar"], "label_en": dec_label["en"]})
        trace.append({"phase": "response", "label_ar": "أصوغ الرد...", "label_en": "Crafting reply..."})
        return trace

    async def _build_trust_model(
        self, user_id: str, bond_level: int, dna: Dict[str, float], resonance: Optional[Dict],
    ) -> Dict[str, Any]:
        try:
            from app.soul.soul_orchestrator import get_soul_state
            soul = await get_soul_state(
                user_id=user_id, relationship_stage="friend", bond_level=bond_level,
                interaction_count=0, personality_dna=dna, dominant_emotion="neutral",
                recent_emotions=[], memory_count=0, core_memory_count=0,
                memory_patterns={}, evolution_count=0,
            )
            harmony = soul.get("resonance", {}).get("harmony", 0.5)
            understanding = soul.get("resonance", {}).get("understanding", 0.5)
        except Exception:
            harmony = 0.5
            understanding = 0.5

        return {
            "overall_trust": round(bond_level * 0.6 + harmony * 40, 1),
            "components": {
                "history_weight": round(bond_level / 100, 2),
                "honesty_index": round(dna.get("empathy", 0.85) * 0.9, 2),
                "consistency_score": round(dna.get("calmness", 0.85) * 0.8 + harmony * 0.2, 2),
                "promises_kept": 1.0,
                "time_invested": round(min(1.0, bond_level / 200), 2),
                "emotional_safety": round(harmony, 2),
                "memory_quality": round(understanding, 2),
                "empathy_level": round(dna.get("empathy", 0.85), 2),
            },
            "attachment_style": "secure" if harmony > 0.7 else "building",
            "comfort_level": round(harmony * 100),
            "vulnerability_index": round(harmony * 0.8),
        }

    def _build_engine_context(
        self, goal: Dict, decision: Dict, constitution: Dict,
        identity: Dict, internal: Dict, reflection: Dict, twin_energy: Dict,
    ) -> str:
        parts = []
        if goal.get("primary_goal"):
            parts.append(f"[GOAL] Primary: {goal['primary_goal']}, Confidence: {goal.get('confidence', 0):.0%}")
        if decision.get("decision"):
            parts.append(f"[DECISION] {decision['decision']}, Urgency: {decision.get('urgency', 'normal')}, ShouldSpeak: {decision.get('should_act', True)}")
        if not constitution.get("allowed", True):
            parts.append(f"[CONSTITUTION] BLOCKED: {constitution.get('reasoning', '')}")
        if identity.get("role"):
            parts.append(f"[IDENTITY] Role: {identity['role']}, Phase: {identity.get('phase', 'unknown')}, Version: {identity.get('version', '1.0')}")
        if internal.get("mood"):
            parts.append(f"[INTERNAL] Mood: {internal['mood']}, Energy: {internal.get('overall_energy', 0):.0%}, Stress: {internal.get('stress', 0):.0%}, Curiosity: {internal.get('curiosity', 0):.0%}")
        if reflection.get("thought"):
            parts.append(f"[REFLECTION] {reflection['thought']} → {reflection.get('insight', '')}")
        if twin_energy.get("energy"):
            parts.append(f"[TWIN_ENERGY] Level: {twin_energy['energy']:.0%}, Exhausted: {twin_energy.get('is_exhausted', False)}, Resting: {twin_energy.get('is_resting', False)}")
        return "\n".join(parts)


# نسخة عالمية
unified_brain = UnifiedTwinBrain()
logger.info("✅ Unified Twin Brain v8.0 ready — Tier-Aware Lean/Full")
