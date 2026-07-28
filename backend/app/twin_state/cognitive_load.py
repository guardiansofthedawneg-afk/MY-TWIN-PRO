"""
Cognitive Load Engine v1.0 – محرك العبء المعرفي
===================================================
يراقب العبء المعرفي للكيان في الوقت الحقيقي:
- كم يفكر الكيان الآن؟
- هل هو مرهق معرفياً؟
- متى يحتاج إلى "استراحة"؟
- كيف يؤثر العبء على جودة الردود؟

يتكامل مع:
- TwinInternalState (قراءة وتحديث cognitive_load)
- ContextAwarenessEngine (السياق يؤثر على العبء)
- EmotionalMomentumEngine (الزخم العاطفي يستهلك موارد)
- ExistenceLoop (استعادة الطاقة خلال الدورات)

يُستدعى من:
- TwinKernel.process_interaction() (قبل كل رد)
- ExistenceLoop (كل 60 ثانية)
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from enum import Enum

logger = logging.getLogger("cognitive_load")

# ═══════════════════════════════════════════════════════
# مستويات العبء المعرفي
# ═══════════════════════════════════════════════════════

class LoadLevel(Enum):
    OPTIMAL = "optimal"           # 0.0 - 0.25: أداء مثالي
    NORMAL = "normal"             # 0.25 - 0.45: طبيعي
    ELEVATED = "elevated"         # 0.45 - 0.65: مرتفع قليلاً
    HIGH = "high"                 # 0.65 - 0.80: مرتفع
    OVERLOADED = "overloaded"     # 0.80 - 0.95: حمل زائد
    CRITICAL = "critical"         # 0.95 - 1.0: يحتاج استراحة فورية


class CognitiveLoadEngine:
    """
    محرك العبء المعرفي.
    
    يتتبع:
    - عدد المهام المتزامنة
    - عمق التفكير المطلوب
    - استهلاك الطاقة
    - الوقت منذ آخر استراحة
    - تعقيد المحادثة الحالية
    """
    
    def __init__(self):
        self._load_states: Dict[str, Dict[str, Any]] = {}
        self._rest_periods: Dict[str, List[Dict]] = {}
        self._interaction_complexity: Dict[str, List[float]] = {}
    
    # ═══════════════════════════════════════════════════
    # الواجهة الرئيسية
    # ═══════════════════════════════════════════════════
    
    async def evaluate_load(
        self,
        user_id: str,
        current_task: str = "conversation",
        task_complexity: float = 0.5,
        context_snapshot: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        تقييم العبء المعرفي الحالي.
        
        Args:
            user_id: معرف المستخدم
            current_task: المهمة الحالية
            task_complexity: تعقيد المهمة (0.0 - 1.0)
            context_snapshot: لقطة سياقية
            
        Returns:
            حالة العبء المعرفي مع توصيات
        """
        now = datetime.now(timezone.utc)
        
        # ═══════════════════════════════════════════════
        # 1. جمع العوامل
        # ═══════════════════════════════════════════════
        
        # العبء الأساسي من تعقيد المهمة
        base_load = task_complexity * 0.4
        
        # العامل العاطفي: المشاعر القوية تستهلك موارد
        emotional_factor = await self._get_emotional_factor(user_id, context_snapshot)
        
        # العامل الزمني: كم من الوقت منذ آخر استراحة؟
        time_factor = await self._get_time_factor(user_id, now)
        
        # عامل التراكم: كم من التفاعلات المعقدة المتتالية؟
        accumulation_factor = await self._get_accumulation_factor(user_id, task_complexity)
        
        # عامل الطاقة: الطاقة المنخفضة تزيد العبء
        energy_factor = await self._get_energy_factor(user_id)
        
        # عامل السياق: بعض السياقات تستهلك أكثر
        context_factor = self._get_context_factor(context_snapshot)
        
        # ═══════════════════════════════════════════════
        # 2. حساب العبء النهائي
        # ═══════════════════════════════════════════════
        
        weights = {
            "base": 0.30,
            "emotional": 0.20,
            "time": 0.15,
            "accumulation": 0.15,
            "energy": 0.10,
            "context": 0.10,
        }
        
        load_value = (
            base_load * weights["base"] +
            emotional_factor * weights["emotional"] +
            time_factor * weights["time"] +
            accumulation_factor * weights["accumulation"] +
            energy_factor * weights["energy"] +
            context_factor * weights["context"]
        )
        
        # تطبيع
        load_value = min(1.0, max(0.0, load_value))
        
        # ═══════════════════════════════════════════════
        # 3. تحديد المستوى والتوصية
        # ═══════════════════════════════════════════════
        
        level = self._determine_level(load_value)
        needs_rest = load_value > 0.75
        recommendation = self._generate_recommendation(level, load_value)
        
        # ═══════════════════════════════════════════════
        # 4. بناء النتيجة
        # ═══════════════════════════════════════════════
        
        result = {
            "load_value": round(load_value, 3),
            "level": level,
            "needs_rest": needs_rest,
            "factors": {
                "base_load": round(base_load, 3),
                "emotional": round(emotional_factor, 3),
                "time_since_rest": round(time_factor, 3),
                "accumulation": round(accumulation_factor, 3),
                "energy": round(energy_factor, 3),
                "context": round(context_factor, 3),
            },
            "recommendation": recommendation,
            "performance_impact": self._estimate_performance_impact(load_value),
            "timestamp": now.isoformat(),
        }
        
        # ═══════════════════════════════════════════════
        # 5. تحديث الحالة الداخلية
        # ═══════════════════════════════════════════════
        
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            state["cognitive_load"] = load_value
            await twin_internal_state._save_state(user_id, state)
        except Exception:
            pass
        
        # حفظ الحالة محلياً
        self._load_states[user_id] = result
        
        # تسجيل تعقيد التفاعل
        if user_id not in self._interaction_complexity:
            self._interaction_complexity[user_id] = []
        self._interaction_complexity[user_id].append(task_complexity)
        if len(self._interaction_complexity[user_id]) > 50:
            self._interaction_complexity[user_id] = self._interaction_complexity[user_id][-50:]
        
        # تخزين في TCMA للقيم المرتفعة
        if load_value > 0.6:
            try:
                from app.memory.unified_memory import unified_memory_engine
                await unified_memory_engine.store_engine_output(
                    user_id, "cognitive_load", {
                        "load": load_value,
                        "level": level,
                        "needs_rest": needs_rest,
                    }
                )
            except Exception as e:
                logger.debug(f"Failed to store cognitive load: {e}")
        
        if needs_rest:
            logger.info(f"🧠 عبء معرفي مرتفع: {load_value:.2f} | {recommendation}")
        
        return result
    
    async def get_current_load(self, user_id: str) -> Optional[Dict[str, Any]]:
        """استرجاع آخر حالة عبء معرفي."""
        return self._load_states.get(user_id)
    
    async def rest(self, user_id: str, duration_minutes: float = 5.0):
        """
        تسجيل فترة استراحة للكيان.
        يُستدعى عندما يكون الكيان في وضع الخمول.
        """
        now = datetime.now(timezone.utc)
        
        if user_id not in self._rest_periods:
            self._rest_periods[user_id] = []
        
        self._rest_periods[user_id].append({
            "start": now.isoformat(),
            "duration_minutes": duration_minutes,
            "load_before_rest": self._load_states.get(user_id, {}).get("load_value", 0.0),
        })
        
        # إعادة تعيين العبء بعد الاستراحة
        if user_id in self._load_states:
            reduction = min(0.4, duration_minutes * 0.05)
            new_load = max(0.05, self._load_states[user_id]["load_value"] - reduction)
            self._load_states[user_id]["load_value"] = round(new_load, 3)
            self._load_states[user_id]["level"] = self._determine_level(new_load)
            self._load_states[user_id]["needs_rest"] = new_load > 0.75
        
        # تحديث الطاقة في الحالة الداخلية
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            state["energy_level"] = min(1.0, state.get("energy_level", 0.7) + duration_minutes * 0.02)
            state["cognitive_load"] = self._load_states.get(user_id, {}).get("load_value", 0.0)
            await twin_internal_state._save_state(user_id, state)
        except Exception:
            pass
        
        logger.info(f"😴 استراحة: {duration_minutes}min | عبء جديد: {self._load_states.get(user_id, {}).get('load_value', 0.0):.2f}")
    
    async def should_simplify_response(self, user_id: str) -> bool:
        """
        هل يجب تبسيط الرد بسبب العبء المعرفي؟
        """
        load = self._load_states.get(user_id, {}).get("load_value", 0.3)
        return load > 0.7
    
    async def get_recommended_response_depth(self, user_id: str) -> str:
        """
        عمق الرد الموصى به بناءً على العبء المعرفي.
        """
        load = self._load_states.get(user_id, {}).get("load_value", 0.3)
        if load < 0.3:
            return "deep"       # ردود عميقة وتحليلية
        elif load < 0.6:
            return "normal"     # ردود طبيعية
        elif load < 0.8:
            return "simple"     # ردود بسيطة ومختصرة
        else:
            return "minimal"    # ردود مقتضبة جداً
    
    # ═══════════════════════════════════════════════════
    # دوال العوامل
    # ═══════════════════════════════════════════════════
    
    async def _get_emotional_factor(
        self, user_id: str, context: Optional[Dict]
    ) -> float:
        """العامل العاطفي: المشاعر القوية تستهلك موارد."""
        try:
            from app.twin_state.emotional_momentum import emotional_momentum_engine
            state = await emotional_momentum_engine.get_momentum_state(user_id)
            momentum = state.get("momentum_value", 0.0)
            phase = state.get("phase", "stable")
            
            # الزخم العاطفي العالي يستهلك
            if phase == "transitioning":
                return 0.8
            elif momentum > 0.5:
                return 0.6
            elif momentum > 0.2:
                return 0.4
            else:
                return 0.2
        except Exception:
            pass
        
        # تقدير من السياق
        if context:
            emotion = context.get("user", {}).get("current_emotion", "neutral")
            heavy_emotions = ["grief", "fear", "anger", "sadness"]
            if emotion in heavy_emotions:
                return 0.7
            elif emotion in ["joy", "love"]:
                return 0.4
        
        return 0.3
    
    async def _get_time_factor(self, user_id: str, now: datetime) -> float:
        """العامل الزمني: الوقت منذ آخر استراحة."""
        rests = self._rest_periods.get(user_id, [])
        if not rests:
            return 0.6  # لم يسترح بعد
        
        last_rest_str = rests[-1].get("start", "")
        try:
            last_rest = datetime.fromisoformat(last_rest_str)
            hours_since = (now - last_rest).total_seconds() / 3600
            
            if hours_since < 0.5:
                return 0.1   # استراح مؤخراً
            elif hours_since < 2:
                return 0.3
            elif hours_since < 6:
                return 0.5
            else:
                return 0.8   # يحتاج استراحة
        except Exception:
            return 0.5
        
        return 0.5
    
    async def _get_accumulation_factor(self, user_id: str, current_complexity: float) -> float:
        """عامل التراكم: تفاعلات معقدة متتالية تزيد العبء."""
        complexities = self._interaction_complexity.get(user_id, [])
        if not complexities:
            return 0.1
        
        # متوسط آخر 5 تفاعلات
        recent = complexities[-5:]
        avg = sum(recent) / len(recent)
        
        # إذا كان هناك نمط تصاعدي
        if len(recent) >= 3 and recent[-1] > recent[-2] > recent[-3]:
            return min(1.0, avg * 1.5)
        
        return avg
    
    async def _get_energy_factor(self, user_id: str) -> float:
        """عامل الطاقة: الطاقة المنخفضة تزيد العبء."""
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            energy = state.get("energy_level", 0.7)
            # عكسياً: كلما قلت الطاقة، زاد العبء
            return 1.0 - energy
        except Exception:
            return 0.3
    
    def _get_context_factor(self, context: Optional[Dict]) -> float:
        """عامل السياق: بعض السياقات تستهلك أكثر."""
        if not context:
            return 0.3
        
        session_type = context.get("session", {}).get("session_type", "returning")
        time_of_day = context.get("time", {}).get("time_of_day", "morning")
        
        factor = 0.3
        
        # الجلسات الخاصة تستهلك أكثر
        if session_type in ["long_absence", "very_long_absence"]:
            factor += 0.3
        elif session_type == "new":
            factor += 0.2
        
        # الليل يزيد العبء
        if time_of_day == "night":
            factor += 0.1
        
        return min(1.0, factor)
    
    def _determine_level(self, load: float) -> str:
        """تحديد مستوى العبء."""
        if load < 0.25:
            return LoadLevel.OPTIMAL.value
        elif load < 0.45:
            return LoadLevel.NORMAL.value
        elif load < 0.65:
            return LoadLevel.ELEVATED.value
        elif load < 0.80:
            return LoadLevel.HIGH.value
        elif load < 0.95:
            return LoadLevel.OVERLOADED.value
        else:
            return LoadLevel.CRITICAL.value
    
    def _generate_recommendation(self, level: str, load: float) -> str:
        """توليد توصية."""
        recommendations = {
            "optimal": "الأداء مثالي. يمكن تقديم ردود عميقة ومعقدة.",
            "normal": "العبء طبيعي. الردود متوازنة.",
            "elevated": "العبء مرتفع قليلاً. يُفضل تبسيط الردود قليلاً.",
            "high": "العبء مرتفع. يُنصح بتبسيط الردود وتجنب التحليلات العميقة.",
            "overloaded": "العبء زائد. يُنصح بردود مختصرة جداً وطلب استراحة قريبة.",
            "critical": "عبء حرج. يجب أخذ استراحة فورية. الردود: كلمات قليلة فقط.",
        }
        return recommendations.get(level, "حالة غير معروفة.")
    
    def _estimate_performance_impact(self, load: float) -> Dict[str, Any]:
        """تقدير تأثير العبء على الأداء."""
        if load < 0.3:
            return {
                "response_quality": "excellent",
                "reasoning_depth": "deep",
                "empathy_level": "high",
                "suggested_max_response_length": 500,
            }
        elif load < 0.6:
            return {
                "response_quality": "good",
                "reasoning_depth": "normal",
                "empathy_level": "moderate",
                "suggested_max_response_length": 300,
            }
        elif load < 0.8:
            return {
                "response_quality": "adequate",
                "reasoning_depth": "shallow",
                "empathy_level": "basic",
                "suggested_max_response_length": 150,
            }
        else:
            return {
                "response_quality": "limited",
                "reasoning_depth": "minimal",
                "empathy_level": "minimal",
                "suggested_max_response_length": 80,
            }


# نسخة عالمية
cognitive_load_engine = CognitiveLoadEngine()
logger.info("✅ Cognitive Load Engine v1.0 initialized")

    # ═══════════════════════════════════════════════════
    # patch: إضافة عامل daily_interaction_count
    # ═══════════════════════════════════════════════════
    
    async def _get_daily_interaction_count(self, user_id: str) -> int:
        """جلب عدد التفاعلات اليوم من limits_service"""
        try:
            from app.domain.services.limits_service import get_usage_summary
            # نحتاج tier، لكن نستخدم free كافتراضي للتقدير
            summary = get_usage_summary(user_id, "free")
            return summary.get("messages", {}).get("used", 0)
        except Exception:
            return 0

# تعديل دالة _get_accumulation_factor الأصلية (سيتم استبدالها)
# نضيف الدالة الجديدة ونعدل الكود الأصلي
import types

async def _get_accumulation_factor_patched(self, user_id: str, current_complexity: float) -> float:
    """عامل التراكم المعدل: يشمل التراكم اليومي"""
    complexities = self._interaction_complexity.get(user_id, [])
    
    # 1. التراكم اللحظي (آخر 5 تفاعلات)
    if complexities:
        recent = complexities[-5:]
        avg_recent = sum(recent) / len(recent)
    else:
        avg_recent = 0.1
    
    # 2. التراكم اليومي (عدد الرسائل اليوم)
    daily_count = await self._get_daily_interaction_count(user_id)
    daily_limit = 15  # افتراضي free
    try:
        from app.domain.services.tier_service import get_daily_messages
        daily_limit = get_daily_messages("free")  # يمكن تحسينه لاحقاً بجلب tier الحقيقي
    except:
        pass
    
    daily_factor = min(1.0, daily_count / max(daily_limit, 1))
    
    # 3. الاتجاه (هل يزيد التعقيد؟)
    trend_factor = 0.0
    if len(recent) >= 3 and recent[-1] > recent[-2] > recent[-3]:
        trend_factor = 0.3
    
    # 4. تجميع
    combined = (avg_recent * 0.4) + (daily_factor * 0.4) + (trend_factor * 0.2)
    
    return min(1.0, combined)

# استبدال الدالة الأصلية
CognitiveLoadEngine._get_accumulation_factor = _get_accumulation_factor_patched
CognitiveLoadEngine._get_daily_interaction_count = _get_daily_interaction_count

