"""
Relationship Service v4.0 – خدمة العلاقات مع AI Intent Detection
==================================================================
يدعم TCMA Relationship Memory + AI Intent Detection.
"""
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("relationship_service")

try:
    from app.memory.relationship.relationship_memory import get_relationship_context_for_response, store_relationship_snapshot
    TCMA_RELATIONSHIP_AVAILABLE = True
except ImportError:
    TCMA_RELATIONSHIP_AVAILABLE = False

try:
    from app.memory.relationship.attachment_model import detect_attachment_style
    TCMA_ATTACHMENT_AVAILABLE = True
except ImportError:
    TCMA_ATTACHMENT_AVAILABLE = False

try:
    from app.infrastructure.database.supabase_client import get_db
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False

STAGES = {
    "stranger": {"min": 0, "max": 20, "label_ar": "غريب", "label_en": "Stranger"},
    "familiar": {"min": 20, "max": 40, "label_ar": "مألوف", "label_en": "Familiar"},
    "friend": {"min": 40, "max": 60, "label_ar": "صديق", "label_en": "Friend"},
    "close_friend": {"min": 60, "max": 80, "label_ar": "صديق مقرب", "label_en": "Close Friend"},
    "trusted_companion": {"min": 80, "max": 95, "label_ar": "رفيق موثوق", "label_en": "Trusted Companion"},
    "soul_twin": {"min": 95, "max": 100, "label_ar": "توأم روح", "label_en": "Soul Twin"},
}

QUICK_INTENT = {
    "ar": {
        "greeting": ["مرحبا","اهلا","صباح الخير","هاي"],
        "gratitude": ["شكرا","تسلم","ممنون"],
        "goodbye": ["مع السلامة","باي","سلام"],
        "self_reflection": ["أنا مش قادر","عندي مشكلة","محتار","خايف"],
        "goal_setting": ["هدف","أخطط","نفسي أحقق"],
    },
    "en": {
        "greeting": ["hello","hi","good morning"],
        "gratitude": ["thank you","thanks"],
        "goodbye": ["bye","see you"],
        "self_reflection": ["i can't","i'm scared","i'm confused"],
        "goal_setting": ["goal","plan","i want to achieve"],
    }
}

async def load(user_id: str) -> Dict[str, Any]:
    if TCMA_RELATIONSHIP_AVAILABLE:
        try:
            context = await get_relationship_context_for_response(user_id, "")
            rel = context.get("relationship", {})
            return {"trust": rel.get("trust", 50), "openness": rel.get("openness", 50), "attachment": rel.get("attachment", 30), "comfort": rel.get("comfort", 50), "stage": "friend", "bond_level": rel.get("bond_level", rel.get("trust", 50)), "interaction_count": 0}
        except Exception as e:
            logger.warning(f"TCMA relationship failed: {e}")
    return {"trust": 50, "openness": 50, "attachment": 30, "comfort": 50, "stage": "friend", "bond_level": 50, "trend": "stable", "interaction_count": 0}

async def update(user_id: str, emotion: Optional[Dict] = None, message: Optional[str] = None, journey_phase: Optional[str] = None, attachment_style: Optional[str] = None) -> Optional[Dict[str, str]]:
    state = await load(user_id)
    if emotion:
        primary = emotion.get("primary", "neutral")
        intensity = emotion.get("intensity", 0.5)
        effects = {"joy": 2, "sadness": 3, "fear": 2, "anger": -1}
        state["trust"] = max(0, min(100, state.get("trust", 50) + effects.get(primary, 0) * intensity))
    interaction_count = state.get("interaction_count", 0) + 1
    state["interaction_count"] = interaction_count
    state["bond_level"] = min(100, (state.get("trust", 50) + min(interaction_count * 0.1, 30)))
    if TCMA_RELATIONSHIP_AVAILABLE:
        try:
            dims = {"trust": state.get("trust", 50), "openness": state.get("openness", 50), "attachment": state.get("attachment", 30), "comfort": state.get("comfort", 50)}
            await store_relationship_snapshot(user_id, dims, state.get("stage", "friend"))
        except: pass
    return None

def detect_intent(message: str, lang: str = "ar") -> Tuple[str, float]:
    """اكتشاف النية بالقواعد السريعة (احتياطي)"""
    if not message: return "general", 0.0
    text = message.lower().strip()
    rules = QUICK_INTENT.get(lang, QUICK_INTENT["ar"])
    best, best_score = "general", 0.0
    for intent, keywords in rules.items():
        score = sum(1.0 / len(keywords) for kw in keywords if kw in text)
        if score > best_score:
            best_score = min(score, 1.0)
            best = intent
    return best, best_score

async def detect_intent_ai(message: str, lang: str = "ar") -> Tuple[str, float, str]:
    """اكتشاف النية باستخدام AI Gateway"""
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        prompt = f"""Analyze the user message and return ONLY a JSON object with:
- intent: one of [greeting, gratitude, goodbye, self_reflection, goal_setting, question, complaint, sharing, general]
- confidence: 0.0 to 1.0
- reasoning: short explanation in {"Arabic" if lang == "ar" else "English"}

Message: {message[:500]}

JSON:"""
        response = await ai_gateway.generate(prompt, max_tokens=150)
        import json
        start = response.find('{')
        end = response.rfind('}') + 1
        if start >= 0 and end > start:
            data = json.loads(response[start:end])
            return data.get("intent", "general"), data.get("confidence", 0.5), data.get("reasoning", "")
    except Exception as e:
        logger.debug(f"AI intent detection failed: {e}")
    # احتياطي: استخدام القواعد
    intent, confidence = detect_intent(message, lang)
    return intent, confidence, "rule-based fallback"

logger.info("✅ Relationship Service v4.0 initialized with AI intent detection")
