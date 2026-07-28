"""
Ad Service v2.0 – خدمة الإعلانات المتكاملة
=============================================
- مشاهدة إعلانات لاستعادة طاقة الكيان (الباقة المجانية)
- حد أقصى 5 إعلانات يومياً
- Explorer Pass يمنح وصولاً مميزاً مؤقتاً
- ربط مباشر مع TwinEnergyEngine و LimitsService
"""
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db
import logging

logger = logging.getLogger("ad_service")

DAILY_AD_LIMIT = 5
ENERGY_RESTORE_PER_AD = 0.20  # 20% طاقة لكل إعلان


async def claim_ad_reward(
    user_id: str,
    ad_type: str = "rewarded",
    ad_platform: str = "google",
    pass_duration_minutes: int = 60,
) -> dict:
    """مشاهدة إعلان واستعادة طاقة + Explorer Pass"""
    db = get_db()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    # جلب عدد الإعلانات المشاهدة اليوم
    res = db.table("ad_views").select("*").eq("user_id", user_id).gte("created_at", today_start).execute()
    watched_today = len(res.data) if res.data else 0

    if watched_today >= DAILY_AD_LIMIT:
        return {"success": False, "message": "لقد وصلت للحد الأقصى اليومي للإعلانات"}

    # تسجيل الإعلان
    db.table("ad_views").insert({
        "user_id": user_id,
        "ad_type": ad_type,
        "ad_platform": ad_platform,
        "created_at": now.isoformat(),
    }).execute()

    # حساب وقت انتهاء Explorer Pass
    pass_expires_at = (now + timedelta(minutes=pass_duration_minutes)).isoformat()

    # تخزين Pass
    db.table("user_explorer_passes").upsert({
        "user_id": user_id,
        "active": True,
        "expires_at": pass_expires_at,
        "updated_at": now.isoformat(),
    }).execute()

    # استعادة طاقة الكيان
    energy_restored = False
    try:
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        new_state = await twin_energy_engine.restore_energy(
            user_id=user_id,
            amount=ENERGY_RESTORE_PER_AD,
            source="ad_reward",
        )
        energy_restored = True
        new_energy = new_state.get("energy", 0)
    except Exception as e:
        logger.warning(f"فشل استعادة الطاقة من الإعلان: {e}")
        new_energy = None

    logger.info(f"🎬 إعلان لـ {user_id}: +{ENERGY_RESTORE_PER_AD*100:.0f}% طاقة، {pass_duration_minutes} دقيقة Pass")

    return {
        "success": True,
        "message": f"تمت استعادة {ENERGY_RESTORE_PER_AD*100:.0f}% من طاقة التوأم + Explorer Pass لمدة {pass_duration_minutes} دقيقة",
        "explorer_pass_duration": pass_duration_minutes,
        "explorer_pass_expires_at": pass_expires_at,
        "energy_restored": ENERGY_RESTORE_PER_AD if energy_restored else 0,
        "current_energy": new_energy,
        "remaining_ads": DAILY_AD_LIMIT - watched_today - 1,
    }


async def get_ad_status(user_id: str) -> dict:
    """حالة الإعلانات والطاقة للمستخدم"""
    db = get_db()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    # عدد الإعلانات اليوم
    res = db.table("ad_views").select("*").eq("user_id", user_id).gte("created_at", today_start).execute()
    watched_today = len(res.data) if res.data else 0

    # حالة Explorer Pass
    pass_res = db.table("user_explorer_passes").select("*").eq("user_id", user_id).eq("active", True).execute()
    pass_active = False
    pass_expires_at = None
    if pass_res.data:
        for p in pass_res.data:
            if p.get("expires_at") and p.get("expires_at") > now.isoformat():
                pass_active = True
                pass_expires_at = p["expires_at"]
                break

    # الباقة الفعلية من TierService
    try:
        from app.domain.services.tier_service import get_tier_config
        tier_config = get_tier_config(user_id)
        user_tier = tier_config.get("name", "free").lower()
        is_ads_required = tier_config.get("ads_required", True)
    except Exception:
        user_tier = "free"
        is_ads_required = True

    # طاقة الكيان الحالية
    try:
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        energy_state = await twin_energy_engine.get_state(user_id)
        current_energy = energy_state.get("energy", 0.7)
        is_low_energy = energy_state.get("is_low_energy", False)
    except Exception:
        current_energy = 0.7
        is_low_energy = False

    return {
        "watched_today": watched_today,
        "daily_limit": DAILY_AD_LIMIT,
        "can_watch_more": watched_today < DAILY_AD_LIMIT,
        "explorer_pass_active": pass_active,
        "explorer_pass_expires_at": pass_expires_at,
        "tier": user_tier,
        "ads_required": is_ads_required,
        "energy_per_ad": ENERGY_RESTORE_PER_AD,
        "current_energy": current_energy,
        "is_low_energy": is_low_energy,
    }


async def restore_energy_from_ad(user_id: str) -> dict:
    """دالة مستقلة لاستعادة الطاقة من إعلان"""
    try:
        from app.engine.energy.twin_energy_engine import twin_energy_engine
        new_state = await twin_energy_engine.restore_energy(
            user_id=user_id,
            amount=ENERGY_RESTORE_PER_AD,
            source="ad_reward",
        )
        return {
            "success": True,
            "energy_restored": ENERGY_RESTORE_PER_AD,
            "current_energy": new_state.get("energy", 0),
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


logger.info("✅ Ad Service v2.0 initialized — متكامل مع الطاقة والباقة")
