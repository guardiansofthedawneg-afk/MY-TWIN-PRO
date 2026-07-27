"""
Existence Loop v2.0 — دورة الحياة المستمرة في الخلفية
=========================================================
تشغّل المحركات الذهنية بشكل دوري لكل مستخدم نشط.
تخزّن مخرجاتها في TCMA. تعمل حتى في غياب المستخدم.
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
        logger.info("🔄 Existence Loop v2.0 started for all active users")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        self._tasks.clear()
        logger.info("Existence Loop stopped")

    async def _get_active_users(self) -> List[str]:
        """جلب المستخدمين النشطين في آخر 24 ساعة"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            result = db.table("profiles").select("id").gte("last_active", cutoff).limit(50).execute()
            return [r["id"] for r in (result.data or [])]
        except Exception as e:
            logger.warning(f"Failed to get active users: {e}")
            return []

    async def _run_tick_loop(self):
        """كل 60 ثانية: تحديث الحالة الداخلية والطاقة لكل مستخدم نشط"""
        while self._running:
            try:
                await asyncio.sleep(60)
                await self._tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Tick error: {e}")

    async def _run_slow_loop(self):
        """كل 10 دقائق: تأمل وتطور لكل مستخدم نشط"""
        while self._running:
            try:
                await asyncio.sleep(600)
                await self._slow_tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Slow tick error: {e}")

    async def _tick(self):
        """تحديث الحالة الداخلية والطاقة"""
        users = await self._get_active_users()
        if not users:
            return

        from app.engine.internal.internal_state_engine import internal_state_engine
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        from app.memory.unified_memory import unified_memory_engine

        for user_id in users[:10]:  # معالجة 10 مستخدمين كحد أقصى في كل دورة
            try:
                state = internal_state_engine.evaluate(emotion="neutral", bond_level=50, twin_energy=0.7)
                energy = twin_energy_engine.update(bond_level=50, hour=datetime.now(timezone.utc).hour)
                await unified_memory_engine.store_engine_output(user_id, "internal_state", state)
                await unified_memory_engine.store_engine_output(user_id, "twin_energy", energy)
            except Exception as e:
                logger.debug(f"Tick failed for {user_id}: {e}")

    async def _slow_tick(self):
        """تأمل وتطور"""
        users = await self._get_active_users()
        if not users:
            return

        from app.engine.reflection.reflection_engine import reflection_engine
        from app.engine.identity.identity_engine import identity_engine
        from app.memory.unified_memory import unified_memory_engine

        for user_id in users[:5]:  # معالجة 5 مستخدمين كحد أقصى
            try:
                reflection = reflection_engine.reflect(bond_level=50, identity_role="companion")
                identity = identity_engine.evaluate(bond_level=50, interaction_count=100, memory_count=50)
                await unified_memory_engine.store_engine_output(user_id, "reflection", reflection)
                await unified_memory_engine.store_engine_output(user_id, "identity", identity)
            except Exception as e:
                logger.debug(f"Slow tick failed for {user_id}: {e}")

existence_loop = ExistenceLoop()
logger.info("✅ Existence Loop v2.0 ready — per-user processing")
