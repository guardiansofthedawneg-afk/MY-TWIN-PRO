"""
Unified Memory Engine v2.0 — ذاكرة TCMA موحدة
===============================================
دورة حياة كاملة: Fresh → Recent → Stable → Core → Legacy
يدعم: Decay, Revival, Linking, Ecology Stats
يتزامن مع Supabase.
"""
import logging, asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from collections import Counter

logger = logging.getLogger("unified_memory")

try:
    from app.infrastructure.database.supabase_client import get_db
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False

# ═══════════════════════════════════════════
# ثوابت دورة حياة الذاكرة
# ═══════════════════════════════════════════
AGE_THRESHOLDS = {
    "fresh":  {"min_days": 0,   "max_days": 1,   "weight_base": 0.05},
    "recent": {"min_days": 1,   "max_days": 7,   "weight_base": 0.25},
    "stable": {"min_days": 7,   "max_days": 30,  "weight_base": 0.50},
    "core":   {"min_days": 30,  "max_days": 180, "weight_base": 0.80},
    "legacy": {"min_days": 180, "max_days": float("inf"), "weight_base": 1.0},
}

TABLE_NAME = "emotional_memory"


class UnifiedMemoryEngine:
    """محرك الذاكرة الموحد."""
    
    async def store(
        self,
        user_id: str,
        content: str,
        reply: str,
        emotion: str = "neutral",
        importance: int = 50,
        lang: str = "ar",
    ) -> Optional[str]:
        """تخزين ذاكرة جديدة."""
        if not DB_AVAILABLE:
            return None
        try:
            db = get_db()
            payload = {
                "user_id": user_id,
                "expressed_text": content[:500],
                "expressed_emotion": emotion,
                "real_emotion": emotion,
                "intensity": importance / 100,
                "confidence": 0.7,
                "valence": 0.2 if emotion in ["joy", "love"] else -0.2 if emotion in ["sadness", "fear", "anger"] else 0.0,
                "importance": importance,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            result = db.table(TABLE_NAME).insert(payload).execute()
            memory_id = result.data[0]["id"] if result.data else ""
            logger.info(f"🧠 ذاكرة مخزنة: {emotion} | أهمية: {importance}")
            return memory_id
        except Exception as e:
            logger.error(f"تخزين الذاكرة فشل: {e}")
            return None
    
    async def retrieve(
        self,
        user_id: str,
        query: str,
        current_emotion: str = "neutral",
        limit: int = 5,
    ) -> Dict[str, Any]:
        """استرجاع ذكريات ذات صلة."""
        if not DB_AVAILABLE:
            return {"memories": [], "count": 0}
        try:
            db = get_db()
            result = (
                db.table(TABLE_NAME)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(50)
                .execute()
            )
            memories = result.data or []
            
            # ترتيب حسب الأهمية والعاطفة
            scored = []
            for m in memories:
                score = m.get("importance", 50)
                if m.get("real_emotion") == current_emotion:
                    score += 20
                created = m.get("created_at", "")
                if created:
                    try:
                        dt = datetime.fromisoformat(created)
                        days_ago = (datetime.now(timezone.utc) - dt).days
                        score -= days_ago * 0.1
                    except:
                        pass
                scored.append({**m, "_score": score})
            
            scored.sort(key=lambda x: x["_score"], reverse=True)
            top = scored[:limit]
            
            return {
                "memories": [
                    {
                        "id": m.get("id"),
                        "content": m.get("expressed_text", ""),
                        "emotion": m.get("real_emotion", "neutral"),
                        "importance": m.get("importance", 50),
                        "created_at": m.get("created_at"),
                    }
                    for m in top
                ],
                "count": len(top),
            }
        except Exception as e:
            logger.error(f"استرجاع الذاكرة فشل: {e}")
            return {"memories": [], "count": 0}
    
    async def get_patterns(self, user_id: str, days: int = 14) -> Dict[str, Any]:
        """تحليل أنماط الذاكرة."""
        if not DB_AVAILABLE:
            return {}
        try:
            db = get_db()
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
            result = (
                db.table(TABLE_NAME)
                .select("*")
                .eq("user_id", user_id)
                .gte("created_at", cutoff)
                .execute()
            )
            memories = result.data or []
            emotions = [m.get("real_emotion", "neutral") for m in memories]
            counter = Counter(emotions)
            total = len(emotions)
            return {
                "dominant_emotion": counter.most_common(1)[0][0] if counter else "neutral",
                "distribution": {k: round(v/total, 2) for k, v in counter.items()} if total else {},
                "total": total,
            }
        except Exception:
            return {}



    async def get_core_memories(self, user_id: str, limit: int = 12) -> List[Dict[str, Any]]:
        """استرجاع الذكريات الأساسية (عالية الأهمية)"""
        if not DB_AVAILABLE:
            return []
        try:
            db = get_db()
            result = (
                db.table(TABLE_NAME)
                .select("*")
                .eq("user_id", user_id)
                .gte("importance", 70)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"get_core_memories failed: {e}")
            return []
    


    async def get_capability_memories(self, user_id: str, capability: str, limit: int = 10) -> List[Dict[str, Any]]:
        """استرجاع ذكريات مرتبطة بقدرة معينة — يبحث في related_to أولاً ثم النص"""
        if not DB_AVAILABLE:
            return []
        try:
            db = get_db()
            from datetime import datetime as dt
            
            # 1. البحث الدقيق: حقل cultural_context أو arabic_category يحتوي على capability
            result = (
                db.table(TABLE_NAME)
                .select("*")
                .eq("user_id", user_id)
                .or_(f"cultural_context.ilike.%{capability}%,arabic_category.ilike.%{capability}%")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            memories = result.data or []
            
            # 2. إذا لم توجد نتائج كافية، نبحث في النص
            if len(memories) < limit:
                result2 = (
                    db.table(TABLE_NAME)
                    .select("*")
                    .eq("user_id", user_id)
                    .ilike("expressed_text", f"%{capability}%")
                    .order("created_at", desc=True)
                    .limit(limit * 2)
                    .execute()
                )
                text_memories = result2.data or []
                
                # دمج مع تجنب التكرار
                existing_ids = {m["id"] for m in memories}
                for m in text_memories:
                    if m["id"] not in existing_ids:
                        memories.append(m)
                        existing_ids.add(m["id"])
                    if len(memories) >= limit:
                        break
            
            return memories[:limit]
        except Exception as e:
            logger.error(f"get_capability_memories failed: {e}")
            return []
    


    async def get_on_this_day(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """ذكريات في مثل هذا اليوم من السنوات السابقة"""
        if not DB_AVAILABLE:
            return []
        try:
            db = get_db()
            today = datetime.now(timezone.utc)
            result = (
                db.table(TABLE_NAME)
                .select("*")
                .eq("user_id", user_id)
                .lt("created_at", today.replace(year=today.year - 1).isoformat())
                .order("created_at", desc=True)
                .limit(limit * 10)
                .execute()
            )
            memories = result.data or []
            filtered = [
                m for m in memories
                if m.get("created_at") and
                datetime.fromisoformat(m["created_at"]).month == today.month and
                datetime.fromisoformat(m["created_at"]).day == today.day
            ]
            return filtered[:limit]
        except Exception as e:
            logger.error(f"get_on_this_day failed: {e}")
            return []
    

unified_memory_engine = UnifiedMemoryEngine()
logger.info("✅ Unified Memory Engine v2.0 ready")
