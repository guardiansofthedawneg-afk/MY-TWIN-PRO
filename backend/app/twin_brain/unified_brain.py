"""
Unified Twin Brain v5.0 — العقل المركزي الموحد
=================================================
ينسق كل الخدمات: الإدراك، العاطفة، الذاكرة، الفضول، الشخصية،
القرار، الصمت، التوقيت، الروح، التطور، الوعي السياقي، الزخم العاطفي،
التجارب، وديناميكيات الفضول.

يدمج الآن:
- ContextAwarenessEngine (الوعي السياقي)
- EmotionalMomentumEngine (الزخم العاطفي)
- CuriosityDynamicsEngine (ديناميكيات الفضول)
- ExperienceEngine (محرك التجارب)
- TwinKernel v3.0 (النواة الموحدة)

✅ لا يوجد منطق ذكاء في الـ Frontend.
✅ هذا الملف هو "الحقيقة الواحدة" (Single Source of Truth).
✅ جميع المتغيرات معرفة قبل الاستخدام.
✅ جميع المحركات مستدعاة في مكانها الصحيح.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("unified_brain")

# ═══════════════════════════════════════════
# استيراد المحركات الموحدة
# ═══════════════════════════════════════════
from app.twin_state.unified_emotion import unified_emotion_engine
from app.memory.unified_memory import unified_memory_engine
from app.twin_state.unified_curiosity import unified_curiosity_engine
from app.twin_state.personality_engine import (
    get_personality_dna, save_personality_dna, DEFAULT_PERSONALITY_DNA
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

# ═══════════════════════════════════════════
# استيراد المحركات الجديدة
# ═══════════════════════════════════════════
from app.twin_state.context_awareness_engine import context_awareness_engine
from app.twin_state.emotional_momentum import emotional_momentum_engine
from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
from app.twin_state.experience_engine import experience_engine


class UnifiedTwinBrain:
    """
    العقل الوحيد للتوأم الرقمي - v5.0.
    يستقبل UnifiedInput ويعيد UnifiedResponse.
    """
    
    async def process(
        self,
        user_id: str,
        message: str,
        lang: str = "ar",
        perception: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        device_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        دورة الحياة الكاملة:
        Perception → Context → Emotion → Memory → Intent → Decision → Response → Evolution
        """
        start_time = datetime.now(timezone.utc)
        perception = perception or {}
        history = history or []
        
        # ═══════════════════════════════
        # 1. الإدراك (Perception)
        # ═══════════════════════════════
        user_state = perception.get("user_state", "normal")
        typing_speed = perception.get("typing_speed", 0)
        absence_minutes = perception.get("absence_duration_minutes", 0)
        time_of_day = perception.get("time_of_day", "morning")
        
        # ═══════════════════════════════
        # 2. الهوية (Identity)
        # ═══════════════════════════════
        identity = await get_identity_context(user_id, lang)
        twin_name = identity.get("twin_name", "MyTwin")
        
        # ═══════════════════════════════
        # 3. العاطفة العميقة (TCMA Emotion)
        # ═══════════════════════════════
        emotion_state = await unified_emotion_engine.analyze(
            user_id=user_id,
            text=message,
            lang=lang,
            previous_messages=[h.get("content", "") for h in history[-5:]],
        )
        current_emotion = emotion_state["primary_emotion"]
        real_emotion = emotion_state["real_emotion"]
        emotion_intensity = emotion_state["intensity"]
        emotion_confidence = emotion_state["confidence"]
        cultural_analysis = emotion_state.get("cultural_analysis", "")
        is_disguised = emotion_state.get("is_disguised", False)
        
        # ═══════════════════════════════
        # 4. الذاكرة (TCMA Memory)
        # ═══════════════════════════════
        memory_context = await unified_memory_engine.retrieve(
            user_id=user_id,
            query=message,
            current_emotion=current_emotion,
            limit=5,
        )
        relevant_memories = memory_context.get("memories", [])
        
        # ═══════════════════════════════
        # 5. الشخصية (Personality DNA)
        # ═══════════════════════════════
        dna = await get_personality_dna(user_id)
        
        # ═══════════════════════════════
        # 6. العلاقة (Relationship)
        # ═══════════════════════════════
        relationship = await load_relationship(user_id)
        bond_level = relationship.get("bond_level", 0)
        phase = relationship.get("stage", "stranger")
        trust = relationship.get("trust", 50)
        
        # ═══════════════════════════════
        # 7. الوعي السياقي (Context Awareness) — جديد
        # ═══════════════════════════════
        context_snapshot = None
        try:
            context_snapshot = await context_awareness_engine.get_full_context(
                user_id=user_id,
                current_emotion=real_emotion,
                user_activity="active",
                device_info=device_info,
            )
            logger.debug(f"Context snapshot: {context_snapshot['time']['time_of_day']}")
        except Exception as e:
            logger.warning(f"Context awareness failed: {e}")
        
        # ═══════════════════════════════
        # 8. الزخم العاطفي (Emotional Momentum) — جديد
        # ═══════════════════════════════
        momentum_state = None
        try:
            momentum_state = await emotional_momentum_engine.update_momentum(
                user_id=user_id,
                detected_emotion=real_emotion,
                emotion_intensity=emotion_intensity,
                context_snapshot=context_snapshot,
            )
            # العاطفة الفعالة بعد تطبيق الزخم
            effective_emotion = momentum_state.get("current_emotion", real_emotion)
            requires_silence = momentum_state.get("requires_silence", False)
        except Exception as e:
            logger.warning(f"Emotional momentum failed: {e}")
            effective_emotion = real_emotion
            requires_silence = False
        
        # ═══════════════════════════════
        # 9. تحديد النية والسلوك (Intent & Behavior)
        # ═══════════════════════════════
        intent = self._determine_intent(
            user_state=user_state,
            emotion=effective_emotion,
            intensity=emotion_intensity,
            bond_level=bond_level,
            phase=phase,
            dna=dna,
            lang=lang,
        )
        behavior = self._decide_behavior(
            intent=intent,
            emotion=effective_emotion,
            phase=phase,
        )
        
        # ═══════════════════════════════
        # 10. بناء حالة الحضور الأساسية
        # ═══════════════════════════════
        presence_state = self._build_presence_state(
            emotion=current_emotion,
            intensity=emotion_intensity,
            dna=dna,
            phase=phase,
            silence_before_ms=0,
        )
        
        # تأثير التعب على الحضور
        if perception.get("user_state") == "tired":
            presence_state["voice_tone"] = "soft"
            presence_state["energy"] = max(0.3, presence_state.get("energy", 0.7) - 0.2)

        
        # ═══════════════════════════════
        # 11. الصمت الذكي (Silence)
        # ═══════════════════════════════
        silence = self._evaluate_silence(
            behavior=behavior,
            emotion=effective_emotion,
            intensity=emotion_intensity,
        )
        
        # إذا كان الزخم العاطفي يتطلب صمتاً
        if requires_silence and not silence["should_be_silent"]:
            silence_duration = await emotional_momentum_engine.get_silence_duration(user_id)
            silence = {
                "should_be_silent": True,
                "reason": "emotional_transition",
                "suggested_pause_ms": int(silence_duration * 1000),
                "presence_action": "soft_breathing",
            }
        
        if silence["should_be_silent"]:
            return self._build_silence_response(silence, emotion_state, relationship)
        
        # ═══════════════════════════════
        # 12. التوقيت الحي (Living Timing)
        # ═══════════════════════════════
        timing = self._calculate_timing(
            emotion=effective_emotion,
            intensity=emotion_intensity,
            user_state=user_state,
        )
        
        # تأثير التعب على التوقيت
        if perception.get("user_state") == "tired":
            timing["reason_ms"] = int(timing.get("reason_ms", 800) * 1.5)
            timing["respond_ms"] = int(timing.get("respond_ms", 400) * 1.3)
        
        # ═══════════════════════════════
        # 13. المحركات الذهنية (Backend Engines)
        # ═══════════════════════════════
        backend_goal = backend_goal_engine.determine_goal(
            perception=user_state,
            emotion=effective_emotion,
            bond_level=bond_level,
            relationship_phase=phase,
            time_of_day=time_of_day,
            memory_context=[m.get("content", "") for m in relevant_memories],
        )
        
        backend_identity = backend_identity_engine.evaluate(
            bond_level=bond_level,
            interaction_count=0,
            memory_count=len(relevant_memories),
        )
        
        backend_constitution_check = backend_constitution_engine.check_action(
            intent=backend_goal["primary_goal"],
            goal=backend_goal["reasoning"],
            bond_level=bond_level,
            identity_role=backend_identity["role"],
        )
        
        backend_decision = backend_decision_engine.decide(
            goal=backend_goal["primary_goal"],
            identity_role=backend_identity["role"],
            bond_level=bond_level,
            emotion=effective_emotion,
            emotion_intensity=emotion_intensity,
            perception=user_state,
            time_of_day=time_of_day,
        )
        
        backend_internal = backend_internal_state_engine.evaluate(
            emotion=effective_emotion,
            bond_level=bond_level,
            twin_energy=0.7,
        )
        
        backend_twin_energy = backend_twin_energy_engine.update(
            bond_level=bond_level,
            hour=datetime.now(timezone.utc).hour,
        )
        
        backend_reflection = backend_reflection_engine.reflect(
            bond_level=bond_level,
            identity_role=backend_identity["role"],
        )
        
        # ═══════════════════════════════
        # 14. بناء سياق المحركات
        # ═══════════════════════════════
        engine_context = self._build_engine_context(
            goal=backend_goal,
            decision=backend_decision,
            constitution=backend_constitution_check,
            identity=backend_identity,
            internal=backend_internal,
            reflection=backend_reflection,
            twin_energy=backend_twin_energy,
        )
        
        # ═══════════════════════════════
        # 15. استدعاء TwinKernel v3.0 — ينسق المحركات الجديدة
        # ═══════════════════════════════
        kernel_result = None
        try:
            from app.twin_state.twin_kernel import twin_kernel
            kernel_result = await twin_kernel.process_interaction(
                user_id=user_id,
                message=message,
                reply="",  # سيتم ملؤه لاحقاً
                emotion=effective_emotion,
                interaction_depth=emotion_intensity,
                device_info=device_info,
            )
            logger.debug(f"TwinKernel processed: {kernel_result.get('engines_triggered', [])}")
        except Exception as e:
            logger.warning(f"TwinKernel failed: {e}")
        
        # ═══════════════════════════════
        # 16. ديناميكيات الفضول (Curiosity Dynamics)
        # ═══════════════════════════════
        curiosity_state = None
        proactive_question = None
        try:
            curiosity_state = await curiosity_dynamics_engine.update_curiosity(
                user_id=user_id,
                current_topic=message[:50],
                topic_novelty=0.5,
                user_emotion=effective_emotion,
                context_snapshot=context_snapshot,
            )
            
            # التحقق من المبادرة
            proactive = await curiosity_dynamics_engine.should_be_proactive(
                user_id, context_snapshot
            )
            if proactive.get("should_proact"):
                proactive_question = proactive.get("suggested_question")
        except Exception as e:
            logger.debug(f"Curiosity dynamics failed: {e}")
        
        # ═══════════════════════════════
        # 17. توليد الرد
        # ═══════════════════════════════
        strategy = {
            "goal": intent["goal"],
            "tone": behavior["tone"],
            "personality_dna": dna,
            "emotion": effective_emotion,
            "engine_context": engine_context,
        }
        
        reply = await build_response(
            user_id=user_id,
            message=message,
            identity_context=identity,
            emotion_context={
                "current_emotion": current_emotion,
                "real_emotion": effective_emotion,
                "intensity": emotion_intensity,
                "confidence": emotion_confidence,
                "recommendation": emotion_state.get("recommendation", ""),
                "cultural_analysis": cultural_analysis,
                "is_culturally_disguised": is_disguised,
            },
            memory_context={"recent_conversations": [
                {"role": "user", "content": m.get("content", ""), "importance": m.get("importance", 50)}
                for m in relevant_memories
            ]},
            strategy=strategy,
            lang=lang,
        )
        
        # ═══════════════════════════════
        # 18. تخزين الذاكرة (Consolidate)
        # ═══════════════════════════════
        await unified_memory_engine.store(
            user_id=user_id,
            content=message,
            reply=reply,
            emotion=effective_emotion,
            importance=self._calculate_importance(emotion_intensity, message),
            lang=lang,
        )
        
        # ═══════════════════════════════
        # 19. محرك التجارب (Experience Engine)
        # ═══════════════════════════════
        experience_result = None
        try:
            event = {
                "type": "message",
                "content": f"User: {message[:100]} | Twin: {reply[:100]}",
                "emotion": effective_emotion,
                "importance": self._calculate_importance(emotion_intensity, message),
                "metadata": {"intent": intent.get("intent")},
            }
            experience_result = await experience_engine.process_event(
                user_id=user_id,
                event=event,
                context_snapshot=context_snapshot,
            )
            if experience_result.get("became_experience"):
                logger.info(f"✨ New experience: {experience_result['experience']['type']}")
        except Exception as e:
            logger.debug(f"Experience engine failed: {e}")

        
        # ═══════════════════════════════
        # 20. تحديث الشخصية (Evolution)
        # ═══════════════════════════════
        evolved_dna = self._evolve_dna(
            dna=dna,
            interaction_quality=self._assess_quality(effective_emotion, intensity=emotion_intensity),
        )
        await save_personality_dna(user_id, evolved_dna)
        
        # ═══════════════════════════════
        # 21. تحديث حالة الحضور بعد الرد
        # ═══════════════════════════════
        presence_state = self._build_presence_state(
            emotion=current_emotion,
            intensity=emotion_intensity,
            dna=evolved_dna,
            phase=phase,
            silence_before_ms=silence.get("suggested_pause_ms", 0),
        )
        
        if perception.get("user_state") == "tired":
            presence_state["voice_tone"] = "soft"
            presence_state["energy"] = max(0.3, presence_state.get("energy", 0.7) - 0.2)
        
        # ═══════════════════════════════
        # 22. تطور الروح (Soul State)
        # ═══════════════════════════════
        interaction_count = await unified_evolution_engine._get_interaction_count(user_id)
        memory_count = await unified_memory_engine.get_memory_count(user_id)
        core_memory_count = await unified_memory_engine.get_core_memory_count(user_id)
        memory_patterns_dict = await unified_memory_engine.get_patterns(user_id, days=14)
        memory_patterns_data = memory_patterns_dict.get("distribution", {}) if memory_patterns_dict else {}
        
        from app.memory.emotional.emotional_memory import get_emotional_patterns
        emotional_data = await get_emotional_patterns(user_id, days=7)
        recent_emotions_list = emotional_data.get("recent_emotions", []) if emotional_data else []
        
        soul_state = await get_soul_state(
            user_id=user_id,
            relationship_stage=phase,
            bond_level=bond_level,
            interaction_count=interaction_count,
            personality_dna=evolved_dna,
            dominant_emotion=effective_emotion,
            recent_emotions=recent_emotions_list,
            memory_count=memory_count,
            core_memory_count=core_memory_count,
            memory_patterns=memory_patterns_data,
            evolution_count=interaction_count // 10,
            lang=lang,
        )
        
        # ═══════════════════════════════
        # 23. SoulBonds
        # ═══════════════════════════════
        try:
            active_bonds = await soul_bonds.get_bonds(user_id)
            if active_bonds:
                for bond in active_bonds:
                    await soul_bonds.strengthen_bond(user_id, bond.get("partner_id", ""))
        except Exception:
            pass
        
        # ═══════════════════════════════
        # 24. التطور طويل المدى
        # ═══════════════════════════════
        evolution_updates = await unified_evolution_engine.record_interaction(
            user_id, effective_emotion, evolved_dna
        )
        
        # ═══════════════════════════════
        # 25. تجميع الاستجابة الموحدة
        # ═══════════════════════════════
        latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        consciousness_trace = self._build_consciousness_trace(
            perception, effective_emotion, relevant_memories, intent, behavior
        )
        
        trust_model = await self._build_trust_model(
            user_id, bond_level, evolved_dna, None
        )
        
        return {
            "reply": reply,
            "presence_state": presence_state,
            "soul_state": soul_state,
            "evolution_updates": evolution_updates,
            "consciousness_trace": consciousness_trace,
            "trust_model": trust_model,
            "context_snapshot": {
                "time_of_day": context_snapshot.get("time", {}).get("time_of_day") if context_snapshot else None,
                "session_type": context_snapshot.get("session", {}).get("session_type") if context_snapshot else None,
                "recommended_tone": context_snapshot.get("composite", {}).get("recommended_tone") if context_snapshot else None,
                "should_be_proactive": context_snapshot.get("composite", {}).get("should_be_proactive") if context_snapshot else None,
            } if context_snapshot else None,
            "emotional_momentum": {
                "effective_emotion": effective_emotion,
                "phase": momentum_state.get("phase") if momentum_state else "stable",
                "requires_silence": requires_silence,
                "momentum_value": momentum_state.get("momentum_value") if momentum_state else 0.0,
            },
            "curiosity": {
                "level": curiosity_state.get("curiosity_level") if curiosity_state else 0.7,
                "phase": curiosity_state.get("phase") if curiosity_state else "gathering",
                "proactive_question": proactive_question,
            },
            "experience": {
                "became_experience": experience_result.get("became_experience") if experience_result else False,
                "type": experience_result.get("experience", {}).get("type") if experience_result else None,
                "reflection": experience_result.get("reflection_generated") if experience_result else None,
            } if experience_result else None,
            "twin_emotional_state": {
                "current_emotion": current_emotion,
                "real_emotion": effective_emotion,
                "intensity": emotion_intensity,
                "confidence": emotion_confidence,
                "cultural_analysis": cultural_analysis,
                "is_culturally_disguised": is_disguised,
                "recommendation": emotion_state.get("recommendation", ""),
            },
            "behavior": {
                "intent": intent["intent"],
                "goal": intent["goal"],
                "tone": behavior["tone"],
                "silence_before_speaking_ms": silence.get("suggested_pause_ms", 0),
            },
            "memory_surfaced": relevant_memories[0] if relevant_memories else None,
            "twin_state_update": {
                "bond_delta": 1,
                "personality_dna": evolved_dna,
                "relationship": {
                    "bond_level": bond_level,
                    "stage": phase,
                    "trust": trust,
                },
            },
            "timing": timing,
            "latency_ms": round(latency_ms, 2),
        }
    
    # ═══════════════════════════════════════════
    # دوال القرار الداخلية
    # ═══════════════════════════════════════════
    
    def _determine_intent(
        self,
        user_state: str,
        emotion: str,
        intensity: float,
        bond_level: int,
        phase: str,
        dna: Dict[str, float],
        lang: str = "ar",
    ) -> Dict[str, str]:
        if emotion == "sadness" and intensity > 0.6:
            goal = "أريد مواساته بلطف" if lang == "ar" else "I want to comfort gently"
            intent = "comfort"
        elif emotion == "fear" and intensity > 0.5:
            goal = "أريد طمأنته" if lang == "ar" else "I want to reassure"
            intent = "reassure"
        elif emotion == "anger":
            goal = "أريد الاستماع أولاً" if lang == "ar" else "I want to listen first"
            intent = "listen"
        elif emotion == "joy":
            goal = "أريد مشاركته الفرحة" if lang == "ar" else "I want to celebrate"
            intent = "celebrate"
        elif user_state == "hesitant":
            goal = "أريد تشجيعه" if lang == "ar" else "I want to encourage"
            intent = "encourage"
        elif user_state == "distant":
            goal = "أريد إعادة الاتصال بلطف" if lang == "ar" else "I want to reconnect"
            intent = "reconnect"
        elif user_state == "focused":
            goal = "أريد مساعدته بدقة" if lang == "ar" else "I want to assist precisely"
            intent = "inform"
        elif dna.get("curiosity", 0) > 0.7 and bond_level > 50:
            goal = "أريد استكشاف أفكاره" if lang == "ar" else "I want to explore"
            intent = "explore"
        else:
            goal = "أريد أن أكون حاضراً" if lang == "ar" else "I want to be present"
            intent = "reflect"
        return {"intent": intent, "goal": goal}
    
    def _decide_behavior(
        self,
        intent: Dict[str, str],
        emotion: str,
        phase: str,
    ) -> Dict[str, str]:
        intent_type = intent["intent"]
        tones = {
            "comfort": "soft_warm", "reassure": "calm_steady",
            "listen": "gentle_patient", "celebrate": "warm_enthusiastic",
            "encourage": "supportive_gentle", "reconnect": "warm_inviting",
            "inform": "precise_clear", "explore": "curious_warm",
            "reflect": "calm_observant",
        }
        tone = tones.get(intent_type, "neutral_warm")
        return {"behavior": intent_type, "tone": tone}
    
    def _evaluate_silence(
        self, behavior: Dict[str, str], emotion: str, intensity: float
    ) -> Dict[str, Any]:
        if behavior["behavior"] in ["listen"] and intensity > 0.7:
            return {"should_be_silent": True, "reason": "user_needs_listener", "suggested_pause_ms": 2500, "presence_action": "attentive_gaze"}
        if emotion in ["sadness"] and intensity > 0.8:
            return {"should_be_silent": True, "reason": "profound_sadness", "suggested_pause_ms": 3500, "presence_action": "soft_breathing"}
        return {"should_be_silent": False, "suggested_pause_ms": 0}
    
    def _build_silence_response(self, silence: Dict, emotion_state: Dict, relationship: Dict) -> Dict[str, Any]:
        return {
            "reply": "",
            "presence_state": {
                "emotion": emotion_state["primary_emotion"], "intensity": emotion_state["intensity"],
                "action": silence["presence_action"], "silence_duration_ms": silence["suggested_pause_ms"],
                "halo_color": "#3B82F6", "energy": 0.3,
            },
            "behavior": {"intent": "silent_presence", "goal": "حضور صامت", "tone": "silent", "silence_before_speaking_ms": silence["suggested_pause_ms"]},
            "memory_surfaced": None,
            "twin_state_update": {"bond_delta": 2, "relationship": relationship},
            "timing": {"response_delay_ms": silence["suggested_pause_ms"]},
            "latency_ms": 0,
        }
    
    def _calculate_timing(self, emotion: str, intensity: float, user_state: str) -> Dict[str, int]:
        base = 250
        if emotion in ["sadness", "fear"]: base = 400
        elif emotion == "anger": base = 300
        elif emotion == "joy": base = 200
        base += int(intensity * 150)
        return {
            "observe_ms": int(base * 0.8), "understand_ms": int(base * 1.0),
            "recall_ms": int(base * 1.2), "reason_ms": int(base * 1.5),
            "respond_ms": int(base * 0.6),
        }
    
    def _calculate_importance(self, intensity: float, message: str) -> int:
        score = int(intensity * 70)
        if len(message) > 50: score += 15
        return min(100, max(10, score))
    
    def _assess_quality(self, emotion: str, intensity: float) -> str:
        if emotion in ["joy", "love"]: return "positive"
        elif emotion in ["sadness", "fear", "anger"] and intensity > 0.7: return "negative"
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
        self,
        perception: Dict,
        real_emotion: str,
        relevant_memories: List,
        intent: Dict,
        behavior: Dict,
    ) -> List[Dict]:
        """يبني مسار الوعي الذي يُعرض في الواجهة."""
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
        self, user_id: str, bond_level: int, dna: Dict[str, float], resonance: Optional[Dict]
    ) -> Dict[str, Any]:
        try:
            from app.soul.soul_orchestrator import get_soul_state
            soul = await get_soul_state(
                user_id=user_id, relationship_stage="friend", bond_level=bond_level,
                interaction_count=0, personality_dna=dna, dominant_emotion="neutral",
                recent_emotions=[], memory_count=0, core_memory_count=0,
                memory_patterns={}, evolution_count=0,
            )
            resonance = soul.get("resonance", {})
            harmony = resonance.get("harmony", 0.5)
            understanding = resonance.get("understanding", 0.5)
        except:
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
        self, goal: Dict, decision: Dict, constitution: Dict, identity: Dict,
        internal: Dict, reflection: Dict, twin_energy: Dict,
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
    
    def _build_presence_state(
        self, emotion: str, intensity: float, dna: Dict[str, float], phase: str, silence_before_ms: int = 0,
    ) -> Dict[str, Any]:
        color_map = {
            "joy": "#F59E0B", "sadness": "#3B82F6", "calm": "#10B981",
            "love": "#EC4899", "anger": "#EF4444", "fear": "#A78BFA",
            "neutral": "#A855F7", "curious": "#8B5CF6", "focused": "#3B82F6",
            "inspired": "#10B981", "concerned": "#F97316", "happy": "#FBBF24",
        }
        energy_map = {
            "joy": 0.9, "sadness": 0.3, "calm": 0.6, "love": 0.8,
            "anger": 0.9, "fear": 0.5, "neutral": 0.7, "curious": 0.8,
            "focused": 0.9, "inspired": 0.85, "concerned": 0.6, "happy": 0.9,
        }
        breath_map = {"joy": 14, "sadness": 8, "calm": 10, "love": 12, "anger": 16, "fear": 12, "neutral": 12}
        warmth = dna.get("empathy", 0.85) * 0.8 + intensity * 0.2
        return {
            "emotion": emotion, "intensity": intensity,
            "energy": energy_map.get(emotion, 0.7), "warmth": round(warmth, 2),
            "halo_color": color_map.get(emotion, "#A855F7"),
            "breath_rate": breath_map.get(emotion, 12),
            "voice_tone": "soft" if emotion in ["sadness", "calm"] else "warm" if emotion in ["joy", "love"] else "neutral",
            "silence_before_speaking_ms": silence_before_ms,
        }


# نسخة عامة
unified_brain = UnifiedTwinBrain()
logger.info("✅ Unified Twin Brain v5.0 ready — all consciousness engines integrated")
