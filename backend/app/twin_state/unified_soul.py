"""
Unified Soul Engine v2.0 — الروح الرقمية الموحدة
===================================================
SoulCore, SoulValues, SoulResonance, SoulSignature, SoulTraits, SoulTimeline.
تتطور كل 10 رسائل. تُستدعى من unified_brain.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("unified_soul")

try:
    from app.twin_state.internal_state import twin_internal_state
    INTERNAL_STATE_AVAILABLE = True
except ImportError:
    INTERNAL_STATE_AVAILABLE = False

try:
    from app.twin_state.personality_engine import get_personality_dna
    DNA_AVAILABLE = True
except ImportError:
    DNA_AVAILABLE = False

try:
    from app.twin_state.relationship_service import load as load_relationship
    RELATIONSHIP_AVAILABLE = True
except ImportError:
    RELATIONSHIP_AVAILABLE = False

try:
    from app.memory.unified_memory import unified_memory_engine
    MEMORY_AVAILABLE = True
except ImportError:
    MEMORY_AVAILABLE = False

DEFAULT_SOUL_VALUES = ["التعاطف", "الفضول", "الصدق", "الاستمرارية"]
DEFAULT_SOUL_TRAITS = ["ملاحظ", "صبور", "متفهم"]

class UnifiedSoulEngine:
    """محرك الروح الموحد – قلب الكيان."""
    
    async def get_soul_state(self, user_id: str, lang: str = "ar") -> Dict[str, Any]:
        """استرجاع حالة الروح الكاملة."""
        soul = await self._load_or_create(user_id)
        return {
            "core": {
                "role": soul.get("role", "observer"),
                "phase_ar": soul.get("phase_ar", "مراقب"),
                "phase_en": soul.get("phase_en", "Observer"),
            },
            "values": {
                "values": soul.get("values", DEFAULT_SOUL_VALUES),
            },
            "traits": {
                "traits": soul.get("traits", DEFAULT_SOUL_TRAITS),
            },
            "signature": {
                "fingerprint": soul.get("fingerprint", ""),
                "created_at": soul.get("created_at", ""),
            },
            "resonance": {
                "harmony": soul.get("harmony", 0.5),
                "understanding": soul.get("understanding", 0.5),
                "sync_level": soul.get("sync_level", "moderate"),
            },
            "timeline": {
                "milestones": soul.get("milestones", []),
                "total_evolutions": soul.get("evolution_count", 0),
            },
        }
    
    async def evolve(self, user_id: str, emotion: str, dna: Dict[str, float]) -> Dict[str, Any]:
        """تطور الروح – يُستدعى كل 10 رسائل."""
        soul = await self._load_or_create(user_id)
        evolution_count = soul.get("evolution_count", 0) + 1
        message_count = soul.get("message_count", 0) + 1
        
        # تحديث الدور بناءً على العلاقة
        role, phase_ar, phase_en = self._determine_role(user_id)
        
        # تحديث القيم بناءً على العاطفة
        values = self._update_values(soul.get("values", DEFAULT_SOUL_VALUES), emotion)
        
        # تحديث الصفات بناءً على DNA
        traits = self._update_traits(soul.get("traits", DEFAULT_SOUL_TRAITS), dna)
        
        # تحديث البصمة
        fingerprint = self._generate_fingerprint(user_id, values, traits)
        
        # تحديث التناغم
        harmony = self._calculate_harmony(user_id)
        
        # تحديث sync_level
        sync_level = "complete" if harmony > 0.8 else "high" if harmony > 0.6 else "moderate" if harmony > 0.3 else "low"
        
        updated_soul = {
            "role": role,
            "phase_ar": phase_ar,
            "phase_en": phase_en,
            "values": values,
            "traits": traits,
            "fingerprint": fingerprint,
            "harmony": harmony,
            "understanding": min(1.0, soul.get("understanding", 0.5) + 0.02),
            "sync_level": sync_level,
            "evolution_count": evolution_count,
            "message_count": message_count,
            "milestones": self._check_milestones(soul.get("milestones", []), evolution_count),
            "created_at": soul.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        await self._save(user_id, updated_soul)
        logger.info(f"✅ Soul evolved #{evolution_count} | Role: {role} | Harmony: {harmony:.0%}")
        
        return await self.get_soul_state(user_id)
    
    async def _load_or_create(self, user_id: str) -> Dict[str, Any]:
        """تحميل الروح من Internal State أو إنشاء جديدة."""
        if INTERNAL_STATE_AVAILABLE:
            try:
                state = await twin_internal_state.get_state(user_id)
                if state and state.get("soul"):
                    return state["soul"]
            except:
                pass
        return {
            "role": "observer",
            "phase_ar": "مراقب",
            "phase_en": "Observer",
            "values": DEFAULT_SOUL_VALUES,
            "traits": DEFAULT_SOUL_TRAITS,
            "fingerprint": "",
            "harmony": 0.5,
            "understanding": 0.5,
            "sync_level": "moderate",
            "evolution_count": 0,
            "message_count": 0,
            "milestones": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    
    async def _save(self, user_id: str, soul: Dict[str, Any]) -> None:
        """حفظ الروح في Internal State."""
        if INTERNAL_STATE_AVAILABLE:
            try:
                await twin_internal_state.update_state(user_id, {"soul": soul})
            except:
                pass
    
    def _determine_role(self, user_id: str) -> tuple:
        """تحديد دور الروح بناءً على العلاقة."""
        phase = "stranger"
        if RELATIONSHIP_AVAILABLE:
            import asyncio
            try:
                rel = asyncio.get_event_loop().run_until_complete(load_relationship(user_id))
                phase = rel.get("stage", "stranger") if asyncio.iscoroutine(rel) else rel.get("stage", "stranger")
            except:
                pass
        
        roles = {
            "soul_twin": ("soul_partner", "رفيق الروح", "Soul Partner"),
            "trusted_companion": ("protector", "الحامي", "Protector"),
            "close_friend": ("confidant", "المقرب", "Confidant"),
            "friend": ("companion", "الرفيق", "Companion"),
            "familiar": ("explorer", "المستكشف", "Explorer"),
            "stranger": ("observer", "المراقب", "Observer"),
        }
        return roles.get(phase, ("observer", "المراقب", "Observer"))
    
    def _update_values(self, current: List[str], emotion: str) -> List[str]:
        """تحديث القيم بناءً على العاطفة."""
        emotion_values = {
            "joy": ["الامتنان", "المشاركة", "التفاؤل"],
            "sadness": ["التعاطف", "الصبر", "الحكمة"],
            "love": ["العطاء", "القبول", "الدفء"],
            "fear": ["الحماية", "الطمأنينة", "الثبات"],
            "anger": ["الاستماع", "التهدئة", "العدل"],
        }
        new_vals = emotion_values.get(emotion, [])
        merged = list(dict.fromkeys(current[-3:] + new_vals))  # إزالة التكرار مع الحفاظ على الترتيب
        return merged[:6]
    
    def _update_traits(self, current: List[str], dna: Dict[str, float]) -> List[str]:
        """تحديث الصفات بناءً على DNA."""
        trait_map = {
            "empathy": "متعاطف",
            "curiosity": "فضولي",
            "humor": "مرح",
            "creativity": "مبدع",
            "calmness": "هادئ",
            "logic": "منطقي",
        }
        new_traits = [trait_map[k] for k, v in dna.items() if v > 0.7 and k in trait_map]
        merged = list(dict.fromkeys(current[-3:] + new_traits))
        return merged[:6]
    
    def _generate_fingerprint(self, user_id: str, values: List[str], traits: List[str]) -> str:
        """توليد بصمة فريدة للروح."""
        import hashlib
        raw = f"{user_id}:{','.join(values)}:{','.join(traits)}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
    
    def _calculate_harmony(self, user_id: str) -> float:
        """حساب تناغم الروح."""
        harmony = 0.5
        if DNA_AVAILABLE:
            import asyncio
            try:
                dna = asyncio.get_event_loop().run_until_complete(get_personality_dna(user_id))
                empathy = dna.get("empathy", 0.85)
                calmness = dna.get("calmness", 0.85)
                harmony = (empathy + calmness) / 2
            except:
                pass
        return round(min(1.0, harmony), 2)
    
    def _check_milestones(self, current: List[Dict], count: int) -> List[Dict]:
        """التحقق من الإنجازات."""
        milestones = [1, 10, 50, 100, 500, 1000]
        for m in milestones:
            if count >= m and not any(x.get("evolution") == m for x in current):
                current.append({
                    "evolution": m,
                    "achieved_at": datetime.now(timezone.utc).isoformat(),
                    "label_ar": f"تطور الروح #{m}",
                    "label_en": f"Soul Evolution #{m}",
                })
        return current


unified_soul_engine = UnifiedSoulEngine()
logger.info("✅ Unified Soul Engine v2.0 ready")
