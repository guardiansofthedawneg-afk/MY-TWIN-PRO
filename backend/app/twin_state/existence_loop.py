"""
Existence Loop v4.0 – دورات حياة مع محركات P1
=================================================
- Tick (60s): Internal State + Context + Cognitive Load
- Slow (10min): Reflection + Identity + Self Model + Salience
- Hourly (1h): World Model analysis + Experience summary
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
        if self._running: return
        self._running = True
        self._tasks.append(asyncio.create_task(self._run_tick_loop()))
        self._tasks.append(asyncio.create_task(self._run_slow_loop()))
        self._tasks.append(asyncio.create_task(self._run_hourly_loop()))
        logger.info("🔄 Existence Loop v4.0 started with P1 engines")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        self._tasks.clear()

    async def _get_active_users(self, hours: int = 24, limit: int = 50) -> List[str]:
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
            res = db.table("profiles").select("id").gte("last_active", cutoff).limit(limit).execute()
            return [r["id"] for r in (res.data or [])]
        except: return []

    async def _run_tick_loop(self):
        while self._running:
            await asyncio.sleep(60)
            try: await self._tick()
            except asyncio.CancelledError: break
            except Exception as e: logger.error(f"Tick error: {e}")

    async def _run_slow_loop(self):
        while self._running:
            await asyncio.sleep(600)
            try: await self._slow_tick()
            except asyncio.CancelledError: break
            except Exception as e: logger.error(f"Slow tick error: {e}")

    async def _run_hourly_loop(self):
        while self._running:
            await asyncio.sleep(3600)
            try: await self._hourly_tick()
            except asyncio.CancelledError: break
            except Exception as e: logger.error(f"Hourly tick error: {e}")

    async def _tick(self):
        users = await self._get_active_users(24, 20)
        if not users: return
        from app.memory.unified_memory import unified_memory_engine
        for user_id in users[:10]:
            try:
                # Internal State & Energy
                from app.engine.internal.internal_state_engine import internal_state_engine
                from app.engine.energy.twin_energy_engine import twin_energy_engine
                state = internal_state_engine.evaluate(emotion="neutral", bond_level=50, twin_energy=0.7)
                energy = twin_energy_engine.update(bond_level=50, hour=datetime.now(timezone.utc).hour)
                await unified_memory_engine.store_engine_output(user_id, "internal_state", state)
                await unified_memory_engine.store_engine_output(user_id, "twin_energy", energy)

                # Context Awareness
                from app.twin_state.context_awareness_engine import context_awareness_engine
                snapshot = await context_awareness_engine.get_full_context(user_id=user_id, current_emotion="neutral", user_activity="idle")
                await unified_memory_engine.store_engine_output(user_id, "context_awareness", {"time_of_day": snapshot["time"]["time_of_day"], "cognitive_load": snapshot["cognitive"]["load_level"]})

                # Cognitive Load
                from app.twin_state.cognitive_load import cognitive_load_engine
                await cognitive_load_engine.evaluate_load(user_id=user_id, current_task="background", task_complexity=0.3, context_snapshot=snapshot)

                # تحديث internal state
                from app.twin_state.internal_state import twin_internal_state
                istate = await twin_internal_state.get_state(user_id)
                istate["cognitive_load"] = snapshot["cognitive"]["load_level"]
                await twin_internal_state._save_state(user_id, istate)

                # راحة إذا لزم
                if snapshot["cognitive"]["load_level"] > 0.8:
                    await cognitive_load_engine.rest(user_id, duration_minutes=2)
            except Exception as e:
                logger.debug(f"Tick failed for {user_id}: {e}")

    async def _slow_tick(self):
        users = await self._get_active_users(48, 10)
        if not users: return
        from app.memory.unified_memory import unified_memory_engine
        for user_id in users[:5]:
            try:
                # Reflection & Identity
                from app.engine.reflection.reflection_engine import reflection_engine
                from app.engine.identity.identity_engine import identity_engine
                reflection = reflection_engine.reflect(bond_level=50, identity_role="companion")
                identity = identity_engine.evaluate(bond_level=50, interaction_count=100, memory_count=50)
                await unified_memory_engine.store_engine_output(user_id, "reflection", reflection)
                await unified_memory_engine.store_engine_output(user_id, "identity", identity)

                # Self Model
                from app.twin_state.self_model import self_model_engine
                await self_model_engine.evaluate_self(user_id)

                # Salience
                from app.twin_state.salience_engine import salience_engine
                await salience_engine.evaluate_salience(user_id, {"type": "time_passage", "content": "مرور الوقت", "emotion": "neutral", "intensity": 0.3})

                # Curiosity
                from app.twin_state.curiosity_dynamics import curiosity_dynamics_engine
                await curiosity_dynamics_engine.update_curiosity(user_id=user_id, current_topic="", topic_novelty=0.3, user_emotion="neutral")
            except Exception as e:
                logger.debug(f"Slow tick failed for {user_id}: {e}")

    async def _hourly_tick(self):
        users = await self._get_active_users(72, 5)
        if not users: return
        from app.memory.unified_memory import unified_memory_engine
        for user_id in users[:3]:
            try:
                # World Model
                from app.twin_state.world_model import world_model_engine
                snapshot = await world_model_engine.get_world_snapshot(user_id)
                await unified_memory_engine.store_engine_output(user_id, "world_snapshot", snapshot)

                # Experience Summary
                from app.twin_state.experience_engine import experience_engine
                summary = await experience_engine.summarize_session_experiences(user_id)
                if summary["total"] > 0:
                    await unified_memory_engine.store_engine_output(user_id, "session_summary", summary)

                # Continuity Snapshot
                from app.twin_state.internal_state import twin_internal_state
                await twin_internal_state.save_continuity_snapshot(user_id)
            except Exception as e:
                logger.debug(f"Hourly tick failed for {user_id}: {e}")

existence_loop = ExistenceLoop()
logger.info("✅ Existence Loop v4.0 ready")
