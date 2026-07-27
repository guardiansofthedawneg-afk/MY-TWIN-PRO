"""
Twin OS Kernel v3.0 – نواة موحدة مع محركات الوعي الجديدة
===========================================================
- يربط Context Awareness, Emotional Momentum, Curiosity Dynamics, Experience Engine
- تشغيل المحركات بالتوازي مع عزل الأخطاء
- تسجيل أداء كل محرك
- تمرير context_snapshot لجميع المحركات
"""
import logging, asyncio, time
from typing import Dict, Any, Optional

logger = logging.getLogger("twin_kernel")

class TwinKernel:
    """النواة الموحدة للتوأم الرقمي - v3.0"""
    
    def __init__(self):
        self._initialized = False
        self._interaction_count = 0

    async def initialize(self):
        self._initialized = True
        logger.info("🧬 Twin OS Kernel v3.0 initialized")

    async def process_interaction(
        self,
        user_id: str,
        message: str,
        reply: str,
        emotion: str,
        interaction_depth: float = 0.5,
        device_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """معالجة تفاعل كامل مع دمج جميع محركات الوعي."""
        self._interaction_count += 1
        result = {
            "kernel_version": "3.0",
            "interaction_count": self._interaction_count,
            "engines_triggered": [],
            "perf": {},
        }
        
        # ═══════════════════════════════════════════════
        # 1. بناء السياق أولاً (تحتاجه بقية المحركات)
        # ═══════════════════════════════════════════════
        context_snapshot = None
        try:
            from app.twin_state.context_awareness_engine import context_awareness_engine
            t0 = time.time()
            context_snapshot = await context_awareness_engine.get_full_context(
                user_id=user_id,
                current_emotion=emotion,
                user_activity="active",
                device_info=device_info,
            )
            result["engines_triggered"].append("context_awareness")
            result["perf"]["context_awareness"] = f"{(time.time()-t0)*1000:.1f}ms"
        except Exception as e:
            logger.error(f"Context awareness failed: {e}")
        
        # ═══════════════════════════════════════════════
        # 2. تجهيز المهام بالتوازي
        # ═══════════════════════════════════════════════
        tasks, task_names = [], []
        
        # Internal State
        async def update_internal():
            t0 = time.time()
            from app.twin_state.internal_state import twin_internal_state
            await twin_internal_state.update_mood(user_id, emotion, interaction_depth)
            return time.time() - t0
        tasks.append(update_internal()); task_names.append("internal_state")

        # Relationship Economy
        async def update_economy():
            t0 = time.time()
            from app.twin_state.relationship_economy import relationship_economy
            itype = "casual_chat"
            if interaction_depth > 0.7: itype = "deep_conversation"
            elif emotion in ["sadness", "fear"]: itype = "emotional_support"
            await relationship_economy.process_interaction(user_id, itype, interaction_depth)
            return time.time() - t0
        tasks.append(update_economy()); task_names.append("relationship_economy")

        # Dynamic Personality
        async def update_personality():
            t0 = time.time()
            from app.twin_state.dynamic_personality import dynamic_personality
            itype_map = {"joy":"casual","sadness":"emotional_support","fear":"emotional_support","love":"deep_conversation","anger":"conflict"}
            await dynamic_personality.evolve(user_id, itype_map.get(emotion,"casual"), emotion, interaction_depth)
            return time.time() - t0
        tasks.append(update_personality()); task_names.append("dynamic_personality")

        # Emotion Bus
        async def broadcast_emotion():
            t0 = time.time()
            from app.twin_state.emotion_bus import emotion_bus
            await emotion_bus.broadcast(user_id, emotion, {"message": message[:200], "reply": reply[:200], "depth": interaction_depth})
            return time.time() - t0
        tasks.append(broadcast_emotion()); task_names.append("emotion_bus")

        # Episodic Memory
        if interaction_depth > 0.6:
            async def record_episode():
                t0 = time.time()
                from app.memory.episodic.episodic_memory import episodic_memory
                await episodic_memory.record_event(user_id, message, reply, emotion, interaction_depth)
                return time.time() - t0
            tasks.append(record_episode()); task_names.append("episodic_memory")

        # Working Memory
        async def update_working():
            t0 = time.time()
            from app.twin_state.working_memory import working_memory
            await working_memory.add_interaction(user_id, message, reply, emotion)
            return time.time() - t0
        tasks.append(update_working()); task_names.append("working_memory")

        # --- المحركات الجديدة ---
        # Emotional Momentum
        async def emotional_momentum_task():
            t0 = time.time()
            from app.twin_state.emotional_momentum import emotional_momentum_engine
            momentum_state = await emotional_momentum_engine.update_momentum(
                user_id=user_id, detected_emotion=emotion,
                emotion_intensity=interaction_depth, context_snapshot=context_snapshot,
            )
            try:
                from app.twin_state.internal_state import twin_internal_state
                state = await twin_internal_state.get_state(user_id)
                state["emotional_momentum_state"] = {
                    "current_momentum": momentum_state.get("momentum_value", 0),
                    "phase": momentum_state.get("phase", "stable"),
                    "transition_path": momentum_state.get("transition_path"),
                    "time_in_current_emotion": momentum_state.get("time_in_current_emotion", 0),
                }
                await twin_internal_state._save_state(user_id, state)
            except: pass
            return time.time() - t0
        tasks.append(emotional_momentum_task()); task_names.append("emotional_momentum")

        # Curiosity Dynamics
        async def curiosity_task():
            t0 = time.time()
            from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
            curiosity_state = await curiosity_dynamics_engine.update_curiosity(
                user_id=user_id, current_topic=message[:50], topic_novelty=0.5,
                user_emotion=emotion, context_snapshot=context_snapshot,
            )
            try:
                from app.twin_state.internal_state import twin_internal_state
                state = await twin_internal_state.get_state(user_id)
                state["curiosity_dynamics_state"] = {
                    "phase": curiosity_state.get("phase", "gathering"),
                    "last_question_time": None,
                    "topics_explored": [],
                    "questions_asked_today": 0,
                }
                await twin_internal_state._save_state(user_id, state)
            except: pass
            return time.time() - t0
        tasks.append(curiosity_task()); task_names.append("curiosity_dynamics")

        # Experience Engine
        async def experience_task():
            t0 = time.time()
            from app.twin_state.experience_engine import experience_engine
            event = {
                "type": "message",
                "content": f"User: {message[:100]} | Twin: {reply[:100]}",
                "emotion": emotion,
                "importance": int(interaction_depth * 100),
                "metadata": {"interaction_count": self._interaction_count},
            }
            exp_result = await experience_engine.process_event(
                user_id=user_id, event=event, context_snapshot=context_snapshot,
            )
            if exp_result.get("became_experience"):
                result.setdefault("experiences", []).append(exp_result["experience"])
            return time.time() - t0
        tasks.append(experience_task()); task_names.append("experience_engine")

        # ═══════════════════════════════════════════════
        # 3. تنفيذ متوازي مع عزل الأخطاء
        # ═══════════════════════════════════════════════
        results_raw = await asyncio.gather(*tasks, return_exceptions=True)
        for name, res in zip(task_names, results_raw):
            if isinstance(res, Exception):
                logger.debug(f"Engine {name} failed: {res}")
            else:
                result["engines_triggered"].append(name)
                result["perf"][name] = f"{res*1000:.1f}ms"

        # ═══════════════════════════════════════════════
        # 4. اقتراح مبادرات الفضول
        # ═══════════════════════════════════════════════
        try:
            from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
            proactive = await curiosity_dynamics_engine.should_be_proactive(user_id, context_snapshot)
            if proactive.get("should_proact"):
                result["proactive_suggestion"] = proactive.get("suggested_question")
                result["proactive_type"] = proactive.get("question_type")
        except Exception as e:
            logger.debug(f"Proactive check failed: {e}")

        # ═══════════════════════════════════════════════
        # 5. تحديث العبء المعرفي
        # ═══════════════════════════════════════════════
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            state["cognitive_load"] = context_snapshot["cognitive"]["load_level"] if context_snapshot else 0.5
            await twin_internal_state._save_state(user_id, state)
        except: pass

        # ═══════════════════════════════════════════════
        # 6. تعلم كل 10 تفاعلات
        # ═══════════════════════════════════════════════
        if self._interaction_count % 10 == 0:
            try:
                from app.twin_state.twin_learner import twin_learner
                insights = await twin_learner.learn_from_interactions(user_id)
                result["engines_triggered"].append("twin_learner")
                result["insights"] = insights
            except: pass

        return result

twin_kernel = TwinKernel()
logger.info("✅ Twin OS Kernel v3.0 ready (all consciousness engines integrated)")
