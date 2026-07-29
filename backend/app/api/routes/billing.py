"""
Billing Routes v4.0 – مع تقارير الإيرادات والتكاليف
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

# ... (جميع المسارات السابقة verify, status, history, cancel, redeem, health, plans, restore موجودة كما هي)

# ========== الإضافات الجديدة ==========

@router.get("/revenue")
async def get_revenue(api_key: str = Query(...)):
    """تقارير الإيرادات (داخلي)"""
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal only")
    from app.domain.billing.revenue_service import get_monthly_revenue, get_total_revenue, get_ad_revenue, get_revenue_projection
    monthly = await get_monthly_revenue()
    total = await get_total_revenue(30)
    ads = await get_ad_revenue(30)
    projection = await get_revenue_projection(12, 0.15)
    return {"monthly": monthly, "total": total, "ads": ads, "projection": projection}

@router.get("/costs")
async def get_costs(api_key: str = Query(...)):
    """تقارير التكاليف (داخلي)"""
    if api_key != os.getenv("SOUL_SYNC_INTERNAL_KEY", "SOUL_SYNC_INTERNAL_KEY"):
        raise HTTPException(403, "Internal only")
    from app.domain.billing.cost_dashboard import get_cost_summary, get_savings_from_internal_model
    summary = await get_cost_summary(30)
    savings = await get_savings_from_internal_model()
    return {"summary": summary, "savings": savings}

logger.info("✅ Billing Routes v4.0 initialized")
