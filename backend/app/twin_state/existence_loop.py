"""
Existence Loop v3.0 – دورة الحياة المستمرة في الخلفية
=========================================================
- تشغّل المحركات الذهنية والوعيية بشكل دوري لكل مستخدم نشط
- تخزّن مخرجاتها في TCMA
- تعمل حتى في غياب المستخدم
- المحركات المضافة: Context Awareness, Emotional Momentum, Curiosity, Experience
"""
import logging, asyncio
from datetime import datetime, timezone, timedelta
from typing import List

logger = logging.getLogger("existence_loop")

class ExistenceLoop:
    def __init__(self):
        self._running = False
        self._tasks = []

    async def start(self):
        if self._running:
            return
        self._running = True
        self._tasks.append(asyncio.create_task(self._run_tick_loop()))
        self._tasks.append(asyncio.create_task(self._run_slow_loop()))
        self._tasks.append(asyncio.create_task(self._run_hourly_loop()))
        logger.info("🔄 Existence Loop v3.0 started for all active users")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        self._tasks.clear()
        logger.info("Existence Loop v3.0 stopped")

    async def _get_active_users(self, hours: int = 24, limit: int = 50) -> List[str]:
        """جلب المستخدمين النشطين في آخر N ساعة"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
            result = db.table("profiles").select("id").gte("last_active", cutoff).limit(limit).execute()
            return [r["id"] for r in (result.data or [])]
        except Exception as e:
            logger.warning(f"Failed to get active users: {e}")
            return []

    async def _run_tick_loop(self):
        """كل 60 ثانية: تحديث الحالة الداخلية والطاقة + Emotional Momentum + Context"""
        while self._running:
            try:
                await asyncio.sleep(60)
                await self._tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Tick error: {e}")

    async def _run_slow_loop(self):
        """كل 10 دقائق: تأمل وتطور + Curiosity + Experience"""
        while self._running:
            try:
                await asyncio.sleep(600)
                await self._slow_tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Slow tick error: {e}")

    async def _run_hourly_loop(self):
        """كل ساعة: تحليل عميق وتلخيص تجارب"""
        while self._running:
            try:
                await asyncio.sleep(3600)
                await self._hourly_tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Hourly tick error: {e}")

    async def _tick(self):
        """تحديث الحالة الداخلية والطاقة + Emotional Momentum + Context Awareness"""
        users = await self._get_active_users(hours=24, limit=20)
        if not users:
            return

        from app.memory.unified_memory import unified_memory_engine

        for user_id in users[:10]:
            try:
                # 1. Internal State
                from app.engine.internal.internal_state_engine import internal_state_engine
                state = internal_state_engine.evaluate(emotion="neutral", bond_level=50, twin_energy=0.7)
                await unified_memory_engine.store_engine_output(user_id, "internal_state", state)

                # 2. Twin Energy
                from app.engine.energy.twin_energy_engine import twin_energy_engine
                energy = twin_energy_engine.update(bond_level=50, hour=datetime.now(timezone.utc).hour)
                await unified_memory_engine.store_engine_output(user_id, "twin_energy", energy)

                # 3. Context Awareness (تحديث السياق)
                try:
                    from app.twin_state.context_awareness_engine import context_awareness_engine
                    snapshot = await context_awareness_engine.get_full_context(
                        user_id=user_id,
                        current_emotion="neutral",
                        user_activity="idle",
                    )
                    await unified_memory_engine.store_engine_output(user_id, "context_awareness", {
                        "time_of_day": snapshot["time"]["time_of_day"],
                        "session_type": "background_tick",
                        "cognitive_load": snapshot["cognitive"]["load_level"],
                    })
                except Exception as e:
                    logger.debug(f"Context awareness tick failed for {user_id}: {e}")

                # 4. Emotional Momentum (تحديث الزخم)
                try:
                    from app.twin_state.emotional_momentum import emotional_momentum_engine
                    await emotional_momentum_engine.update_momentum(
                        user_id=user_id,
                        detected_emotion="neutral",
                        emotion_intensity=0.3,
                    )
                except Exception as e:
                    logger.debug(f"Emotional momentum tick failed for {user_id}: {e}")

                # 5. تحديث العبء المعرفي
                try:
                    from app.twin_state.internal_state import twin_internal_state
                    istate = await twin_internal_state.get_state(user_id)
                    istate["cognitive_load"] = snapshot["cognitive"]["load_level"] if 'snapshot' in dir() else 0.3
                    await twin_internal_state._save_state(user_id, istate)
                except: pass

            except Exception as e:
                logger.debug(f"Tick failed for {user_id}: {e}")

    async def _slow_tick(self):
        """تأمل وتطور + Curiosity + Experience"""
        users = await self._get_active_users(hours=48, limit=10)
        if not users:
            return

        from app.memory.unified_memory import unified_memory_engine

        for user_id in users[:5]:
            try:
                # 1. Reflection
                from app.engine.reflection.reflection_engine import reflection_engine
                reflection = reflection_engine.reflect(bond_level=50, identity_role="companion")
                await unified_memory_engine.store_engine_output(user_id, "reflection", reflection)

                # 2. Identity
                from app.engine.identity.identity_engine import identity_engine
                identity = identity_engine.evaluate(bond_level=50, interaction_count=100, memory_count=50)
                await unified_memory_engine.store_engine_output(user_id, "identity", identity)

                # 3. Curiosity Dynamics (تحديث الفضول)
                try:
                    from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
                    await curiosity_dynamics_engine.update_curiosity(
                        user_id=user_id,
                        current_topic="",
                        topic_novelty=0.3,
                        user_emotion="neutral",
                    )
                except Exception as e:
                    logger.debug(f"Curiosity slow tick failed for {user_id}: {e}")

                # 4. Experience Engine (تحليل الأحداث الأخيرة)
                try:
                    from app.twin_state.experience_engine import experience_engine
                    # حدث خلفي: مرور الوقت والتأمل
                    event = {
                        "type": "time_passage",
                        "content": "مرور الوقت والتأمل الدوري",
                        "emotion": "neutral",
                        "importance": 40,
                        "metadata": {"source": "existence_loop_slow"},
                    }
                    await experience_engine.process_event(user_id=user_id, event=event)
                except Exception as e:
                    logger.debug(f"Experience slow tick failed for {user_id}: {e}")

            except Exception as e:
                logger.debug(f"Slow tick failed for {user_id}: {e}")

    async def _hourly_tick(self):
        """تحليل عميق: تلخيص تجارب، أنماط، وتحديث DNA"""
        users = await self._get_active_users(hours=72, limit=5)
        if not users:
            return

        from app.memory.unified_memory import unified_memory_engine

        for user_id in users[:3]:
            try:
                # 1. تلخيص التجارب
                try:
                    from app.twin_state.experience_engine import experience_engine
                    summary = await experience_engine.summarize_session_experiences(user_id)
                    if summary["total"] > 0:
                        await unified_memory_engine.store_engine_output(user_id, "session_summary", summary)
                except: pass

                # 2. تحديث DNA بناءً على التجارب المتراكمة
                try:
                    from app.twin_state.internal_state import twin_internal_state
                    state = await twin_internal_state.get_state(user_id)
                    bond = state.get("bond_depth", 0)
                    # نضج الكيان مع مرور الوقت
                    if bond > 0.7 and state.get("maturity_level") == "maturing":
                        await twin_internal_state.update_maturity_level(user_id, "mature")
                except: pass

                # 3. تنظيف الذاكرة العاملة القديمة
                try:
                    from app.twin_state.working_memory import working_memory
                    # مجرد قراءة للسياق (التنظيف يحدث تلقائياً في add_interaction)
                    await working_memory.get_recent_context(user_id, limit=1)
                except: pass

                # 4. حفظ لقطة استمرارية
                try:
                    from app.twin_state.internal_state import twin_internal_state
                    await twin_internal_state.save_continuity_snapshot(user_id)
                except: pass

            except Exception as e:
                logger.debug(f"Hourly tick failed for {user_id}: {e}")

existence_loop = ExistenceLoop()
logger.info("✅ Existence Loop v3.0 ready — 3 دورات: Tick (60s) + Slow (10min) + Hourly (1h)")
