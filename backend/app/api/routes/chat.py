"""
CHAT ROUTER v8.0 — Unified Brain مع استجابة كاملة
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    lang: str = "ar"
    user_id: Optional[str] = None
    use_voice: bool = False
    tier: str = "free"
    perception: Optional[Dict] = None
    device_info: Optional[Dict] = None

LIFE_COACH_KEYWORDS = ["مدرب", "حياتي", "مشكلة", "علاقتي", "وظيفتي", "مالي", "نومي", "قلق", "خائف", "حزين"]
CODE_LAB_KEYWORDS = ["كود", "برمجة", "مشروع", "معمارية", "قاعدة بيانات", "API", "React", "FastAPI"]
STUDY_KEYWORDS = ["ادرس", "ذاكر", "شرح", "مفهوم", "رياضيات", "فيزياء", "كيمياء", "تاريخ", "جغرافيا", "درس"]
CREATOR_KEYWORDS = ["اكتب", "مقال", "قصة", "رواية", "إعلان", "منشور", "كتاب", "محتوى", "سكريبت"]
DREAM_KEYWORDS = ["حلم", "حلمت", "تفسير حلم", "رؤيا", "منام", "dream", "nightmare", "كابوس"]
PASS_KEYWORDS = ["مهمة", "مهام", "طقس", "أخبار", "يوتيوب", "فيديو", "weather", "news", "youtube", "task", "reminder", "تذكير", "أنشئ مهمة", "جدول"]
IMAGE_KEYWORDS = ["صورة", "ارسم", "توليد", "تصميم", "جرافيك", "بصري", "image", "generate", "draw", "design", "art"]
SMART_HOME_KEYWORDS = ["شغل", "اطفئ", "نور", "مكيف", "منزل", "غرفة", "إضاءة", "light", "ac", "home"]

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        message = req.message.strip()
        if not message:
            raise HTTPException(400, "Message cannot be empty")

        # ✅ Unified Brain كخيار أول (يحل محل التوجيه اليدوي للمحادثات العامة)
        from app.twin_brain.unified_brain import unified_brain
        response = await unified_brain.process(
            req.user_id, message, req.lang,
            perception=req.perception,
            history=req.history,
            device_info=req.device_info,
            tier=req.tier,
        )
        
        return {
            "reply": response.get("reply", ""),
            "provider": "unified_brain",
            "use_voice": req.use_voice,
            "tone": response.get("tone", "neutral"),
            "emotion": response.get("emotion", "neutral"),
            "intensity": response.get("intensity", 0.5),
            "silence_ms": response.get("silence_ms", 0),
            "energy": response.get("energy", 0.5),
            "bond_level": response.get("bond_level", 0),
            "phase": response.get("phase", "stranger"),
            "latency_ms": response.get("latency_ms", 0),
            "limits": response.get("limits", {"can_send": True, "remaining": 9999}),
            "memory_surfaced": response.get("memory_surfaced"),
            "suggested_question": response.get("suggested_question"),
            "extended": response.get("extended"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, str(e))
