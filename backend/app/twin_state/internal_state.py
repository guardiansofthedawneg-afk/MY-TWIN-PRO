"""
Twin Internal State v3.0 – الحالة الداخلية للتوأم الرقمي
=============================================================
- مزاج، طاقة، فضول، عمق الرابطة
- آخر ما فكّر فيه التوأم
- أسئلة يريد أن يسألها للمستخدم
- Personality DNA، Life Book، Goals، Self Reflections، Continuity
- ✅ حقول جديدة: cognitive_load, curiosity_dynamics_state, emotional_momentum_state
"""
import logging, random, asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("twin_internal_state")

# ============================================================
# الثوابت
# ============================================================
MOODS = ["contemplative", "energetic", "calm", "playful", "serious", "affectionate", "curious"]
MOOD_LABELS = {
    "contemplative": {"ar": "متأمل", "en": "Contemplative"},
    "energetic": {"ar": "نشيط", "en": "Energetic"},
    "calm": {"ar": "هادئ", "en": "Calm"},
    "playful": {"ar": "مرح", "en": "Playful"},
    "serious": {"ar": "جاد", "en": "Serious"},
    "affectionate": {"ar": "عاطفي", "en": "Affectionate"},
    "curious": {"ar": "فضولي", "en": "Curious"},
}

# ═══════════════════════════════════════════════════════
# Personality DNA
# ═══════════════════════════════════════════════════════
DEFAULT_PERSONALITY_DNA = {
    "empathy": 0.85,
    "curiosity": 0.80,
    "humor": 0.50,
    "initiative": 0.60,
    "reflection": 0.90,
    "logic": 0.75,
    "creativity": 0.80,
    "calmness": 0.85,
}

DEFAULT_CURIOSITY_STATE = {
    "phase": "gathering",
    "last_question_time": None,
    "topics_explored": [],
    "questions_asked_today": 0,
}

DEFAULT_MOMENTUM_STATE = {
    "current_momentum": 0.0,
    "phase": "stable",
    "transition_path": None,
    "time_in_current_emotion": 0.0,
}

class TwinInternalState:
    """يدير الحالة الداخلية للتوأم الرقمي"""
    
    def __init__(self):
        self._states: Dict[str, Dict[str, Any]] = {}
    
    async def get_state(self, user_id: str) -> Dict[str, Any]:
        """استرجاع أو إنشاء الحالة الداخلية للتوأم"""
        if user_id in self._states:
            return self._states[user_id]
        
        # محاولة التحميل من Supabase
        try:
            db = get_db()
            res = db.table("twin_internal_states").select("*").eq("user_id", user_id).single().execute()
            if res.data:
                state = {
                    "mood": res.data.get("mood", "calm"),
                    "energy_level": res.data.get("energy_level", 0.8),
                    "curiosity": res.data.get("curiosity", 0.7),
                    "bond_depth": res.data.get("bond_depth", 0.1),
                    "last_thought": res.data.get("last_thought", ""),
                    "pending_questions": res.data.get("pending_questions", []),
                    "dreams": res.data.get("dreams", []),
                    "sent_milestones": res.data.get("sent_milestones", []),
                    "emotions_toward_user": res.data.get("emotions_toward_user", {"longing": 0.1, "gratitude": 0.5, "worry": 0.0}),
                    # المرحلة E
                    "personality_dna": res.data.get("personality_dna", DEFAULT_PERSONALITY_DNA),
                    "life_book": res.data.get("life_book", []),
                    "goals": res.data.get("goals", []),
                    "self_reflections": res.data.get("self_reflections", []),
                    "continuity_snapshot": res.data.get("continuity_snapshot", {}),
                    "maturity_level": res.data.get("maturity_level", "newborn"),
                    # ✅ حقول المحركات الجديدة
                    "cognitive_load": res.data.get("cognitive_load", 0.0),
                    "curiosity_dynamics_state": res.data.get("curiosity_dynamics_state", DEFAULT_CURIOSITY_STATE),
                    "emotional_momentum_state": res.data.get("emotional_momentum_state", DEFAULT_MOMENTUM_STATE),
                    "updated_at": res.data.get("updated_at", datetime.now(timezone.utc).isoformat()),
                }
                self._states[user_id] = state
                return state
        except:
            pass
        
        # حالة افتراضية جديدة
        state = {
            "mood": random.choice(MOODS[:4]),
            "energy_level": 0.85,
            "curiosity": 0.75,
            "bond_depth": 0.1,
            "last_thought": "",
            "pending_questions": [],
            "dreams": [],
            "sent_milestones": [],
            "emotions_toward_user": {"longing": 0.1, "gratitude": 0.5, "worry": 0.0},
            "personality_dna": DEFAULT_PERSONALITY_DNA.copy(),
            "life_book": [],
            "goals": [],
            "self_reflections": [],
            "continuity_snapshot": {},
            "maturity_level": "newborn",
            # ✅ حقول المحركات الجديدة
            "cognitive_load": 0.0,
            "curiosity_dynamics_state": DEFAULT_CURIOSITY_STATE.copy(),
            "emotional_momentum_state": DEFAULT_MOMENTUM_STATE.copy(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self._states[user_id] = state
        await self._save_state(user_id, state)
        return state
    
    async def update_mood(self, user_id: str, user_emotion: str, interaction_depth: float) -> str:
        """تحديث مزاج التوأم بناءً على تفاعل المستخدم"""
        state = await self.get_state(user_id)
        
        emotion_effects = {
            "joy": ["energetic", "playful", "affectionate"],
            "sadness": ["calm", "contemplative", "affectionate"],
            "anger": ["calm", "serious"],
            "fear": ["calm", "affectionate"],
            "love": ["affectionate", "energetic", "playful"],
            "neutral": ["calm", "contemplative"],
        }
        
        possible_moods = emotion_effects.get(user_emotion, MOODS[:4])
        
        if random.random() < interaction_depth:
            new_mood = random.choice(possible_moods)
            while new_mood == state["mood"] and len(possible_moods) > 1:
                new_mood = random.choice(possible_moods)
            state["mood"] = new_mood
        
        state["bond_depth"] = min(1.0, state["bond_depth"] + interaction_depth * 0.05)
        state["energy_level"] = max(0.1, min(1.0, state["energy_level"] - 0.02 + random.random() * 0.04))
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self._save_state(user_id, state)
        return state["mood"]
    
    async def set_last_thought(self, user_id: str, thought: str):
        """تسجيل آخر ما فكّر فيه التوأم"""
        state = await self.get_state(user_id)
        state["last_thought"] = thought[:500]
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
    
    async def add_pending_question(self, user_id: str, question: str):
        """إضافة سؤال يريد التوأم أن يسأله للمستخدم"""
        state = await self.get_state(user_id)
        if "pending_questions" not in state:
            state["pending_questions"] = []
        state["pending_questions"].append(question)
        if len(state["pending_questions"]) > 10:
            state["pending_questions"] = state["pending_questions"][-5:]
        await self._save_state(user_id, state)
    
    async def get_pending_question(self, user_id: str) -> Optional[str]:
        """استخراج سؤال معلّق وحذفه من القائمة"""
        state = await self.get_state(user_id)
        questions = state.get("pending_questions", [])
        if questions:
            q = questions.pop(0)
            state["pending_questions"] = questions
            await self._save_state(user_id, state)
            return q
        return None
    
    async def get_mood_label(self, user_id: str, lang: str = "ar") -> str:
        """استرجاع وصف المزاج باللغة المناسبة"""
        state = await self.get_state(user_id)
        mood = state.get("mood", "calm")
        return MOOD_LABELS.get(mood, {}).get(lang, mood)
    
    # ═══════════════════════════════════════════════════
    # المرحلة E: دوال متقدمة
    # ═══════════════════════════════════════════════════
    
    async def get_personality_dna(self, user_id: str) -> Dict[str, float]:
        state = await self.get_state(user_id)
        return state.get("personality_dna", DEFAULT_PERSONALITY_DNA.copy())
    
    async def update_personality_dna(self, user_id: str, dna_updates: Dict[str, float]) -> Dict[str, float]:
        state = await self.get_state(user_id)
        current = state.get("personality_dna", DEFAULT_PERSONALITY_DNA.copy())
        for key, value in dna_updates.items():
            if key in current:
                current[key] = max(0.0, min(1.0, value))
        state["personality_dna"] = current
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
        return current
    
    async def add_life_book_entry(self, user_id: str, event: str, metadata: Optional[Dict] = None) -> Dict:
        state = await self.get_state(user_id)
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event[:200],
            "bond_snapshot": state.get("bond_depth", 0),
            "memory_count": len(state.get("life_book", [])),
            "phase": "active",
            "metadata": metadata or {},
        }
        life_book = state.get("life_book", [])
        life_book.append(entry)
        if len(life_book) > 500:
            life_book = life_book[-500:]
        state["life_book"] = life_book
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
        return entry
    
    async def get_life_book(self, user_id: str, limit: int = 20) -> List[Dict]:
        state = await self.get_state(user_id)
        life_book = state.get("life_book", [])
        return life_book[-limit:][::-1]
    
    async def add_goal(self, user_id: str, title: str, goal_type: str = "general") -> Dict:
        state = await self.get_state(user_id)
        goal = {
            "id": f"goal_{datetime.now(timezone.utc).timestamp()}",
            "title": title[:100],
            "type": goal_type,
            "progress": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_mentioned": datetime.now(timezone.utc).isoformat(),
        }
        goals = state.get("goals", [])
        goals.append(goal)
        state["goals"] = goals
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
        return goal
    
    async def update_goal_progress(self, user_id: str, goal_id: str, progress: float) -> Optional[Dict]:
        state = await self.get_state(user_id)
        goals = state.get("goals", [])
        for goal in goals:
            if goal["id"] == goal_id:
                goal["progress"] = max(0.0, min(100.0, progress))
                goal["last_mentioned"] = datetime.now(timezone.utc).isoformat()
                state["updated_at"] = datetime.now(timezone.utc).isoformat()
                await self._save_state(user_id, state)
                return goal
        return None
    
    async def get_active_goals(self, user_id: str) -> List[Dict]:
        state = await self.get_state(user_id)
        return [g for g in state.get("goals", []) if g.get("progress", 0) < 100]
    
    async def add_self_reflection(self, user_id: str, observation: str, confidence: float = 0.7) -> Dict:
        state = await self.get_state(user_id)
        reflection = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "observation": observation[:300],
            "confidence": confidence,
        }
        reflections = state.get("self_reflections", [])
        reflections.append(reflection)
        if len(reflections) > 50:
            reflections = reflections[-50:]
        state["self_reflections"] = reflections
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
        return reflection
    
    async def get_self_reflections(self, user_id: str, limit: int = 5) -> List[Dict]:
        state = await self.get_state(user_id)
        reflections = state.get("self_reflections", [])
        return reflections[-limit:][::-1]
    
    async def save_continuity_snapshot(self, user_id: str) -> Dict:
        state = await self.get_state(user_id)
        snapshot = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "personality_dna": state.get("personality_dna", DEFAULT_PERSONALITY_DNA),
            "bond_depth": state.get("bond_depth", 0),
            "memory_count": len(state.get("life_book", [])),
            "goals_active": len([g for g in state.get("goals", []) if g.get("progress", 0) < 100]),
            "maturity_level": state.get("maturity_level", "newborn"),
            "cognitive_load": state.get("cognitive_load", 0.0),
            "curiosity_phase": state.get("curiosity_dynamics_state", {}).get("phase", "gathering"),
            "emotional_momentum_phase": state.get("emotional_momentum_state", {}).get("phase", "stable"),
        }
        state["continuity_snapshot"] = snapshot
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
        return snapshot
    
    async def restore_from_continuity(self, user_id: str) -> Dict:
        state = await self.get_state(user_id)
        snapshot = state.get("continuity_snapshot", {})
        if snapshot:
            if "personality_dna" in snapshot:
                state["personality_dna"] = snapshot["personality_dna"]
            state["updated_at"] = datetime.now(timezone.utc).isoformat()
            await self._save_state(user_id, state)
        return snapshot
    
    async def update_maturity_level(self, user_id: str, level: str) -> str:
        valid_levels = ["newborn", "growing", "maturing", "mature", "wise"]
        if level not in valid_levels:
            state = await self.get_state(user_id)
            return state.get("maturity_level", "newborn")
        state = await self.get_state(user_id)
        state["maturity_level"] = level
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_state(user_id, state)
        return level
    
    async def update_internal_emotion(self, user_id: str) -> str:
        state = await self.get_state(user_id)
        now = datetime.now(timezone.utc)
        
        hour = now.hour
        if 22 <= hour or hour < 6:
            state["mood"] = "contemplative"
        elif 6 <= hour < 10:
            state["mood"] = "energetic"
        elif 14 <= hour < 17:
            state["mood"] = "curious"
        
        pending = state.get("pending_questions", [])
        if len(pending) > 5:
            state["mood"] = "curious"
        
        energy = state.get("energy_level", 0.5)
        if energy > 0.8:
            state["mood"] = "energetic"
        elif energy < 0.3:
            state["mood"] = "contemplative"
        
        last_updated = state.get("updated_at", "")
        if last_updated:
            try:
                last_dt = datetime.fromisoformat(last_updated)
                hours_since = (now - last_dt).total_seconds() / 3600
                if hours_since > 6:
                    state["mood"] = "serious"
            except:
                pass
        
        state["updated_at"] = now.isoformat()
        await self._save_state(user_id, state)
        return state["mood"]

    async def update_emotion_toward_user(self, user_id: str, emotion_type: str, delta: float):
        state = await self.get_state(user_id)
        if "emotions_toward_user" not in state:
            state["emotions_toward_user"] = {"longing": 0.1, "gratitude": 0.5, "worry": 0.0}
        if emotion_type in state["emotions_toward_user"]:
            state["emotions_toward_user"][emotion_type] = max(0.0, min(1.0, state["emotions_toward_user"][emotion_type] + delta))
            await self._save_state(user_id, state)

    async def get_emotions_toward_user(self, user_id: str) -> Dict[str, float]:
        state = await self.get_state(user_id)
        return state.get("emotions_toward_user", {"longing": 0.1, "gratitude": 0.5, "worry": 0.0})

    async def get_dominant_emotion_toward_user(self, user_id: str) -> str:
        emotions = await self.get_emotions_toward_user(user_id)
        if not emotions:
            return "neutral"
        return max(emotions, key=emotions.get)
    
    async def _save_state(self, user_id: str, state: Dict[str, Any]):
        """حفظ الحالة في Supabase"""
        try:
            db = get_db()
            db.table("twin_internal_states").upsert({
                "user_id": user_id,
                "mood": state["mood"],
                "energy_level": state["energy_level"],
                "curiosity": state["curiosity"],
                "bond_depth": state["bond_depth"],
                "last_thought": state["last_thought"],
                "pending_questions": state.get("pending_questions", []),
                "personality_dna": state.get("personality_dna", DEFAULT_PERSONALITY_DNA),
                "life_book": state.get("life_book", []),
                "goals": state.get("goals", []),
                "self_reflections": state.get("self_reflections", []),
                "continuity_snapshot": state.get("continuity_snapshot", {}),
                "maturity_level": state.get("maturity_level", "newborn"),
                "emotions_toward_user": state.get("emotions_toward_user", {}),
                # ✅ حقول جديدة
                "cognitive_load": state.get("cognitive_load", 0.0),
                "curiosity_dynamics_state": state.get("curiosity_dynamics_state", DEFAULT_CURIOSITY_STATE),
                "emotional_momentum_state": state.get("emotional_momentum_state", DEFAULT_MOMENTUM_STATE),
                "updated_at": state["updated_at"],
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save twin state: {e}")


# نسخة عالمية
twin_internal_state = TwinInternalState()
logger.info("✅ Twin Internal State v3.0 initialized with Cognitive Load, Curiosity Dynamics & Emotional Momentum fields")
