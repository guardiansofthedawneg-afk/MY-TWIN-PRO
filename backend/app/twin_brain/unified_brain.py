"""
Unified Twin Brain v4.0 — العقل المركزي الموحد
=================================================
ينسق كل الخدمات: الإدراك، العاطفة (TCMA)، الذاكرة، الفضول،
الشخصية، القرار، الصمت، التوقيت، الروح، التطور.
يُعيد حالة كيان كاملة (Kernel State) للواجهة.
يدعم العربي والأجنبي بنفس العمق.

❌ لا يوجد منطق ذكاء في الـ Frontend بعد الآن.
✅ هذا الملف هو "الحقيقة الواحدة" (Single Source of Truth).
"""
import logging, asyncio
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
from app.twin_state.unified_soul import unified_soul_engine
from app.twin_state.unified_evolution import unified_evolution_engine

from app.twin_state.relationship_service import load as load_relationship


class UnifiedTwinBrain:
    """
    العقل الوحيد للتوأم الرقمي.
    يستقبل UnifiedInput ويعيد UnifiedResponse.
    """
    
    async def process(
        self,
        user_id: str,
        message: str,
        lang: str = "ar",
        perception: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
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
        # 7. تحديد النية والسلوك (Intent & Behavior)
        # ═══════════════════════════════
        intent = self._determine_intent(
            user_state=user_state,
            emotion=real_emotion,
            intensity=emotion_intensity,
            bond_level=bond_level,
            phase=phase,
            dna=dna,
        )
        behavior = self._decide_behavior(
            intent=intent,
            emotion=real_emotion,
            phase=phase,
        )
        
        # ═══════════════════════════════
        # 8. الصمت الذكي (M7: Silence)
        # ═══════════════════════════════
        silence = self._evaluate_silence(
            behavior=behavior,
            emotion=real_emotion,
            intensity=emotion_intensity,
        )
        if silence["should_be_silent"]:
            return self._build_silence_response(silence, emotion_state, relationship)
        
        # ═══════════════════════════════
        # 9. التوقيت الحي (M8: Living Timing)
        # ═══════════════════════════════
        timing = self._calculate_timing(
            emotion=current_emotion,
            intensity=emotion_intensity,
            user_state=user_state,
        )
        
        # ═══════════════════════════════
        # 10. توليد الرد
        # ═══════════════════════════════
        strategy = {
            "goal": intent["goal"],
            "tone": behavior["tone"],
            "personality_dna": dna,
            "emotion": real_emotion,
        }
        reply = await build_response(
            user_id=user_id,
            message=message,
            identity_context=identity,
            emotion_context={
                "current_emotion": current_emotion,
                "real_emotion": real_emotion,
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
        # 11. تخزين الذاكرة (Consolidate)
        # ═══════════════════════════════
        await unified_memory_engine.store(
            user_id=user_id,
            content=message,
            reply=reply,
            emotion=real_emotion,
            importance=self._calculate_importance(emotion_intensity, message),
            lang=lang,
        )
        
        # ═══════════════════════════════
        # 12. تحديث الشخصية (Evolution)
        # ═══════════════════════════════
        evolved_dna = self._evolve_dna(
            dna=dna,
            interaction_quality=self._assess_quality(real_emotion, intensity=emotion_intensity),
        )
        await save_personality_dna(user_id, evolved_dna)
        
        # ═══════════════════════════════
        # 13. بناء حالة الحضور (Presence State)
        # ═══════════════════════════════
        presence_state = self._build_presence_state(
            emotion=current_emotion,
            intensity=emotion_intensity,
            dna=evolved_dna,
            phase=phase,
            silence_before_ms=silence.get("suggested_pause_ms", 0),
        )
        

        # ═══════════════════════════════
        # 13.5 تطور الروح (كل 10 رسائل)
        # ═══════════════════════════════
        interaction_count = await unified_evolution_engine._get_interaction_count(user_id)
        soul_state = {}
        if interaction_count % 10 == 0:
            soul_state = await unified_soul_engine.evolve(user_id, real_emotion, evolved_dna)
        else:
            soul_state = await unified_soul_engine.get_soul_state(user_id, lang)
        
        # ═══════════════════════════════
        # 13.6 التطور طويل المدى
        # ═══════════════════════════════
        evolution_updates = await unified_evolution_engine.record_interaction(user_id, real_emotion, evolved_dna)

        # ═══════════════════════════════
        # 14. تجميع الاستجابة الموحدة
        # ═══════════════════════════════
        latency_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        
        return {
            "reply": reply,
            "presence_state": presence_state,
            "soul_state": soul_state,
            "evolution_updates": evolution_updates,
            "twin_emotional_state": {
                "current_emotion": current_emotion,
                "real_emotion": real_emotion,
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
    
    # ═══════════════════════════════════
    # دوال القرار الداخلية
    # ═══════════════════════════════════
    
    def _determine_intent(
        self,
        user_state: str,
        emotion: str,
        intensity: float,
        bond_level: int,
        phase: str,
        dna: Dict[str, float],
    ) -> Dict[str, str]:
        """تحديد نية التوأم بناءً على كل المدخلات."""
        # قاعدة النوايا
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
        """تحديد نبرة وسلوك التوأم."""
        intent_type = intent["intent"]
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
        tone = tones.get(intent_type, "neutral_warm")
        return {"behavior": intent_type, "tone": tone}
    
    def _evaluate_silence(
        self,
        behavior: Dict[str, str],
        emotion: str,
        intensity: float,
    ) -> Dict[str, Any]:
        """M7: تقييم ما إذا كان الصمت أفضل من الكلام."""
        if behavior["behavior"] in ["listen"] and intensity > 0.7:
            return {
                "should_be_silent": True,
                "reason": "user_needs_listener",
                "suggested_pause_ms": 2500,
                "presence_action": "attentive_gaze",
            }
        if emotion in ["sadness"] and intensity > 0.8:
            return {
                "should_be_silent": True,
                "reason": "profound_sadness",
                "suggested_pause_ms": 3500,
                "presence_action": "soft_breathing",
            }
        return {"should_be_silent": False, "suggested_pause_ms": 0}
    
    def _build_silence_response(
        self,
        silence: Dict,
        emotion_state: Dict,
        relationship: Dict,
    ) -> Dict[str, Any]:
        """بناء رد الصمت."""
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
            "twin_state_update": {
                "bond_delta": 2,
                "relationship": relationship,
            },
            "timing": {"response_delay_ms": silence["suggested_pause_ms"]},
            "latency_ms": 0,
        }
    
    def _calculate_timing(
        self,
        emotion: str,
        intensity: float,
        user_state: str,
    ) -> Dict[str, int]:
        """M8: حساب توقيت الردود."""
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
        """حساب أهمية الذاكرة."""
        score = int(intensity * 70)
        if len(message) > 50:
            score += 15
        return min(100, max(10, score))
    
    def _assess_quality(self, emotion: str, intensity: float) -> str:
        """تقييم جودة التفاعل."""
        if emotion in ["joy", "love"]:
            return "positive"
        elif emotion in ["sadness", "fear", "anger"] and intensity > 0.7:
            return "negative"
        return "neutral"
    
    def _evolve_dna(
        self,
        dna: Dict[str, float],
        interaction_quality: str,
    ) -> Dict[str, float]:
        """تطوير DNA الشخصية."""
        delta = 0.02 if interaction_quality == "positive" else -0.01 if interaction_quality == "negative" else 0
        evolved = {
            "empathy": min(1.0, dna.get("empathy", 0.85) + delta),
            "curiosity": min(1.0, dna.get("curiosity", 0.80) + delta * 0.5),
            "humor": min(1.0, dna.get("humor", 0.50) + (0.03 if interaction_quality == "positive" else 0)),
            "initiative": min(1.0, dna.get("initiative", 0.60) + delta),
            "reflection": min(1.0, dna.get("reflection", 0.90) + delta * 0.8),
            "logic": dna.get("logic", 0.75),
            "creativity": min(1.0, dna.get("creativity", 0.80) + delta * 0.6),
            "calmness": min(1.0, dna.get("calmness", 0.85) + (-0.02 if interaction_quality == "negative" else 0.01)),
        }
        return evolved
    
    def _build_presence_state(
        self,
        emotion: str,
        intensity: float,
        dna: Dict[str, float],
        phase: str,
        silence_before_ms: int = 0,
    ) -> Dict[str, Any]:
        """بناء حالة الحضور للعرض في الواجهة."""
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
        breath_map = {
            "joy": 14, "sadness": 8, "calm": 10, "love": 12,
            "anger": 16, "fear": 12, "neutral": 12,
        }
        warmth = dna.get("empathy", 0.85) * 0.8 + intensity * 0.2
        return {
            "emotion": emotion,
            "intensity": intensity,
            "energy": energy_map.get(emotion, 0.7),
            "warmth": round(warmth, 2),
            "halo_color": color_map.get(emotion, "#A855F7"),
            "breath_rate": breath_map.get(emotion, 12),
            "voice_tone": "soft" if emotion in ["sadness", "calm"] else "warm" if emotion in ["joy", "love"] else "neutral",
            "silence_before_speaking_ms": silence_before_ms,
        }


# نسخة عامة
unified_brain = UnifiedTwinBrain()
logger.info("✅ Unified Twin Brain v4.0 ready")
