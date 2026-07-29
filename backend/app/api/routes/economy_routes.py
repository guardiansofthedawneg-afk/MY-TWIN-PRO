"""
Economy Routes v3.0 – نظام الاقتصاد والطاقة المتكامل
=======================================================
يربط EconomyEngine + TwinEnergyEngine + AdService بشكل حي.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger("economy_routes")
router = APIRouter(prefix="/api/economy", tags=["economy"])

class AdRewardRequest(BaseModel):
    user_id: str
    ad_type: str = "rewarded"
    ad_platform: str = "admob"
    pass_duration_minutes: int = 60

class DailyLoginRequest(BaseModel):
    user_id: str

@router.get("/balance")
async def get_balance(user_id: str):
    """
    رصيد المستخدم الحالي:
    - soul_points: نقاط الروح (من EconomyEngine المحلي)
    - energy: طاقة الكيان (من TwinEnergyEngine)
    - tier: الباقة الحالية
    - messages_remaining: الرسائل المتبقية
    - can_watch_ad: هل يمكن مشاهدة إعلان
    """
    try:
        # جلب الباقة
        from app.domain.services.tier_service import get_tier_config, is_ads_required
        from app.domain.services.limits_service import get_usage_summary
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        from app.domain.billing.ad_service import get_ad_status

        # نفترض أن tier يأتي من قاعدة البيانات، نستخدم "free" كافتراضي إن لم يمرر
        # ولكن في API حقيقي نجلبه من profiles
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        profile = db.table("profiles").select("tier").eq("id", user_id).single().execute()
        tier = profile.data.get("tier", "free") if profile.data else "free"

        # طاقة الكيان
        energy_state = await twin_energy_engine.get_energy_state(user_id, tier=tier)
        
        # استخدام الرسائل
        usage = get_usage_summary(user_id, tier)
        messages_remaining = usage.get("messages", {}).get("remaining", 0)

        # حالة الإعلانات
        ad_status = await get_ad_status(user_id)
        can_watch_ad = ad_status.get("can_watch_more", False) and energy_state.get("is_low_energy", False)

        return {
            "soul_points": {
                "total": 0,  # يمكن ربطه لاحقاً بقاعدة بيانات
                "earned_today": 0,
                "lifetime": 0,
            },
            "energy": {
                "level": energy_state.get("energy", 0.5),
                "is_low": energy_state.get("is_low_energy", False),
                "is_exhausted": energy_state.get("is_exhausted", False),
                "recommendation": energy_state.get("recommendation", ""),
            },
            "subscription": {
                "tier": tier,
                "ads_required": is_ads_required(tier),
                "messages_remaining": messages_remaining,
                "can_watch_ad": can_watch_ad,
            },
            "ad_status": ad_status,
        }
    except Exception as e:
        logger.error(f"Balance error: {e}")
        raise HTTPException(500, str(e))

@router.post("/ad-reward")
async def claim_ad_reward_route(body: AdRewardRequest):
    """مشاهدة إعلان واستعادة طاقة"""
    try:
        from app.domain.billing.ad_service import claim_ad_reward
        result = await claim_ad_reward(
            body.user_id, body.ad_type, body.ad_platform, body.pass_duration_minutes
        )
        return result
    except Exception as e:
        logger.error(f"Ad reward error: {e}")
        raise HTTPException(500, str(e))

@router.post("/daily-login")
async def daily_login_reward(body: DailyLoginRequest):
    """مكافأة تسجيل الدخول اليومي"""
    try:
        # زيادة بسيطة في الطاقة (هدية يومية)
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        await twin_energy_engine.restore_energy(body.user_id, amount=0.05, source="daily_login")
        return {"success": True, "message": "تم منح طاقة إضافية"}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/energy/status")
async def get_energy_status(user_id: str):
    """حالة الطاقة فقط (للواجهة السريعة)"""
    try:
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        from app.infrastructure.database.supabase_client import get_db
        db = get_db()
        profile = db.table("profiles").select("tier").eq("id", user_id).single().execute()
        tier = profile.data.get("tier", "free") if profile.data else "free"
        state = await twin_energy_engine.get_energy_state(user_id, tier=tier)
        return state
    except Exception as e:
        raise HTTPException(500, str(e))

logger.info("✅ Economy Routes v3.0 initialized")
