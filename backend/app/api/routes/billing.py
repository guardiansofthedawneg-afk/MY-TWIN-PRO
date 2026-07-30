"""
Billing Routes v5.0 – مع دعم الترقية المؤقتة (للمفاجآت)
"""
import logging, os, hashlib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from app.api.dependencies.auth import get_current_user_id
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("billing_routes")
router = APIRouter(prefix="/api/billing", tags=["billing"])

PACKAGE_NAME         = os.getenv("ANDROID_PACKAGE_NAME", "com.soulsync.mytwin")
SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
IS_PRODUCTION        = os.getenv("ENVIRONMENT", "development") == "production"

TIER_MAP: dict = {
    "mytwin_plus_monthly":    {"tier": "plus",    "duration_days": 30},
    "mytwin_premium_monthly": {"tier": "premium", "duration_days": 30},
    "mytwin_pro_semiannual":  {"tier": "pro",     "duration_days": 183},
    "mytwin_yearly_annual":   {"tier": "yearly",  "duration_days": 365},
}

class PurchaseRequest(BaseModel):
    product_id:     str = Field(..., min_length=3,  max_length=60)
    purchase_token: str = Field(..., min_length=10, max_length=1000)

class RedeemRequest(BaseModel):
    code: str = Field(..., min_length=5, max_length=50)

class TemporaryUpgradeRequest(BaseModel):
    user_id: str = Field(..., min_length=3)
    tier: str = Field(..., min_length=2)
    duration_days: int = Field(1, ge=1, le=30)

@router.post("/verify")
async def verify_purchase(body: PurchaseRequest, user_id: str = Depends(get_current_user_id)):
    product_info = TIER_MAP.get(body.product_id)
    if not product_info: raise HTTPException(400, "Invalid product")
    tier, duration_days = product_info["tier"], product_info["duration_days"]
    token_hash = hashlib.sha256(body.purchase_token.encode()).hexdigest()

    db = get_db()
    existing = db.table("purchase_history").select("id, user_id").eq("token_hash", token_hash).execute()
    if existing.data and existing.data[0].get("user_id") != user_id:
        raise HTTPException(400, "Token already used")

    from app.domain.billing.subscription_service import upgrade_subscription
    if not await upgrade_subscription(user_id, tier, duration_days):
        raise HTTPException(500, "Upgrade failed")

    expires_at = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat()
    db.table("purchase_history").insert({
        "user_id": user_id, "product_id": body.product_id, "token_hash": token_hash,
        "tier": tier, "duration_days": duration_days, "expires_at": expires_at,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"success": True, "tier": tier, "duration_days": duration_days, "expires_at": expires_at}

@router.get("/status")
async def get_status(user_id: str = Depends(get_current_user_id)):
    from app.domain.billing.subscription_service import get_user_subscription
    sub = await get_user_subscription(user_id)
    plan = sub.get("plan", {})
    expires_at = sub.get("expires_at")
    current_tier = sub.get("tier", "free")
    return {
        "tier": current_tier, "plan_name": plan.get("name", "Free"),
        "expires_at": expires_at, "is_active": sub.get("is_active", True),
    }

@router.post("/upgrade-temporary")
async def upgrade_temporary(body: TemporaryUpgradeRequest):
    """ترقية مؤقتة (للمفاجآت والمكافآت)"""
    from app.domain.billing.subscription_service import upgrade_subscription
    success = await upgrade_subscription(body.user_id, body.tier, body.duration_days)
    if not success:
        raise HTTPException(500, "Temporary upgrade failed")
    return {"success": True, "tier": body.tier, "duration_days": body.duration_days}

@router.get("/health")
async def billing_health():
    return {"status": "healthy", "google_play_configured": bool(SERVICE_ACCOUNT_JSON)}

@router.get("/plans")
async def get_plans():
    from app.domain.billing.subscription_service import SUBSCRIPTION_PLANS
    plans = []
    for tier_id, plan in SUBSCRIPTION_PLANS.items():
        plans.append({"tier": tier_id, "name": plan["name"], "price": plan["price"], "messages": plan["messages"], "features": plan["features"]})
    return {"plans": plans}

@router.post("/restore")
async def restore_purchases(user_id: str = Depends(get_current_user_id)):
    from app.domain.billing.subscription_service import get_user_subscription, upgrade_subscription
    current = await get_user_subscription(user_id)
    if current.get("tier") != "free" and current.get("is_active"):
        return {"success": True, "tier": current["tier"], "message": "Already active"}
    try:
        db = get_db()
        last = db.table("purchase_history").select("tier, duration_days").eq("user_id", user_id).order("verified_at", desc=True).limit(1).execute()
        if last.data:
            p = last.data[0]
            await upgrade_subscription(user_id, p["tier"], p["duration_days"])
            return {"success": True, "tier": p["tier"], "message": "Restored"}
    except Exception as e: logger.warning(f"Restore failed: {e}")
    return {"success": False, "message": "No purchases found"}

@router.post("/cancel")
async def cancel_subscription(user_id: str = Depends(get_current_user_id)):
    get_db().table("profiles").update({"auto_renew": False}).eq("id", user_id).execute()
    return {"success": True}

@router.get("/revenue")
async def get_revenue(api_key: str = Query(...)):
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal only")
    from app.domain.billing.revenue_service import get_monthly_revenue, get_total_revenue
    monthly = await get_monthly_revenue()
    total = await get_total_revenue(30)
    return {"monthly": monthly, "total": total}

@router.get("/costs")
async def get_costs(api_key: str = Query(...)):
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal only")
    from app.domain.billing.cost_dashboard import get_cost_summary
    return await get_cost_summary(30)

logger.info("✅ Billing Routes v5.0 initialized")
