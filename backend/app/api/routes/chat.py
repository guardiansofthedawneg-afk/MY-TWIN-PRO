"""
CHAT ROUTER v3.1 – توجيه ذكي مع Life Coach + Code Lab + Study
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

LIFE_COACH_KEYWORDS = ["مدرب", "حياتي", "مشكلة", "علاقتي", "وظيفتي", "مالي", "نومي", "قلق", "خائف", "حزين"]
CODE_LAB_KEYWORDS = ["كود", "برمجة", "مشروع", "معمارية", "قاعدة بيانات", "API", "React", "FastAPI"]
STUDY_KEYWORDS = ["ادرس", "ذاكر", "شرح", "مفهوم", "رياضيات", "فيزياء", "كيمياء", "تاريخ", "جغرافيا", "درس", "study", "explain", "math", "physics"]

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        message = req.message.strip()
        if not message:
            raise HTTPException(400, "Message cannot be empty")

        if any(kw in message for kw in LIFE_COACH_KEYWORDS):
            try:
                from app.features.life_coach.life_coach_orchestrator import life_coach
                result = await life_coach.full_session(req.user_id, message, req.lang)
                return {"reply": result.get("coach_reply", ""), "provider": "life_coach"}
            except Exception as e:
                logger.warning(f"Life Coach fallback: {e}")

        if any(kw in message for kw in CODE_LAB_KEYWORDS):
            try:
                from app.features.code_lab.code_lab_orchestrator import code_lab
                result = await code_lab.analyze_idea(req.user_id, message, req.lang)
                return {"reply": result.get("recommendation", ""), "provider": "code_lab", "analysis": result}
            except Exception as e:
                logger.warning(f"Code Lab fallback: {e}")

        if any(kw in message for kw in STUDY_KEYWORDS):
            try:
                from app.features.study.athena_orchestrator import athena
                result = await athena.start_study_session(req.user_id, message, "teen", req.lang)
                return {"reply": result.get("explanation", {}).get("simplified", ""), "provider": "athena", "study_data": result}
            except Exception as e:
                logger.warning(f"Study fallback: {e}")

        from app.twin_brain.brain_orchestrator import brain_orchestrator
        response = await brain_orchestrator.process(req.user_id, message, req.history, req.lang)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, str(e))
