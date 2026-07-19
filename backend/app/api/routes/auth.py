"""
Auth Routes v5.0 — متكاملة مع Unified Brain
=============================================
- تم تبسيط Google OAuth.
- يتم تهيئة الكيان بعد تسجيل الدخول تلقائياً.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from app.infrastructure.database.supabase_client import get_db
import logging, httpx

logger = logging.getLogger("auth_routes")
router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginBody(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class SignupBody(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    twin_name: str = "توأمك"
    lang: str = "ar"

class GoogleAuthBody(BaseModel):
    access_token: str = Field(..., min_length=10)
    lang: str = "ar"

async def _wake_up_twin(user_id: str, lang: str = "ar"):
    """تهيئة الكيان بعد تسجيل الدخول"""
    try:
        from app.twin_brain.unified_brain import unified_brain
        greeting = "أنا هنا." if lang == "ar" else "I am here."
        await unified_brain.process(
            user_id=user_id,
            message=greeting,
            lang=lang,
            perception={"user_state": "normal", "time_of_day": "morning"},
        )
        logger.info(f"🧠 Twin awakened for {user_id}")
    except Exception as e:
        logger.warning(f"Twin wake-up skipped: {e}")

@router.post("/login")
async def login(body: LoginBody):
    db = get_db()
    try:
        result = db.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if result.user and result.session:
            db.table("profiles").update({"last_active": datetime.now(timezone.utc).isoformat()}).eq("id", result.user.id).execute()
            # ✅ تهيئة الكيان بعد تسجيل الدخول
            await _wake_up_twin(result.user.id)
            return {
                "token": result.session.access_token,
                "user_id": result.user.id,
                "refresh_token": result.session.refresh_token,
            }
        raise HTTPException(401, "Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(401, "Invalid email or password")

@router.post("/signup")
async def signup(body: SignupBody):
    db = get_db()
    try:
        result = db.auth.sign_up({"email": body.email, "password": body.password})
        if result.user:
            db.table("profiles").insert({
                "id": result.user.id,
                "email": body.email,
                "full_name": body.email.split('@')[0],
                "twin_name": body.twin_name,
                "lang": body.lang,
                "tier": "free",
                "twin_energy": 100,
                "onboarded": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            if result.session:
                await _wake_up_twin(result.user.id, body.lang)
                return {"token": result.session.access_token, "user_id": result.user.id}
            return {"message": "Check your email to confirm", "user_id": result.user.id}
        raise HTTPException(400, "Signup failed")
    except Exception as e:
        logger.error(f"Signup failed: {e}")
        if "already registered" in str(e).lower():
            raise HTTPException(409, "Email already registered")
        raise HTTPException(400, str(e))

@router.post("/google")
async def google_auth(body: GoogleAuthBody):
    db = get_db()
    try:
        # 1. التحقق من صحة توكن Google
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {body.access_token}"},
                timeout=10.0,
            )
            if resp.status_code != 200:
                raise HTTPException(401, "Invalid Google token")
            user_info = resp.json()
            email = user_info.get("email")
            name = user_info.get("name", "")
            if not email:
                raise HTTPException(400, "Email not provided by Google")

        # 2. تسجيل الدخول أو إنشاء حساب عبر Supabase OAuth
        try:
            result = db.auth.sign_in_with_oauth({
                "provider": "google",
                "access_token": body.access_token,
            })
            if result.user and result.session:
                user_id = result.user.id
                # التأكد من وجود الملف الشخصي
                profile = db.table("profiles").select("id").eq("id", user_id).execute()
                if not profile.data:
                    db.table("profiles").insert({
                        "id": user_id,
                        "email": email,
                        "full_name": name or email.split('@')[0],
                        "twin_name": "توأمك" if body.lang == "ar" else "MyTwin",
                        "lang": body.lang,
                        "tier": "free",
                        "twin_energy": 100,
                        "onboarded": False,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }).execute()
                else:
                    db.table("profiles").update({
                        "email": email,
                        "last_active": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", user_id).execute()

                # ✅ تهيئة الكيان
                await _wake_up_twin(user_id, body.lang)
                return {
                    "token": result.session.access_token,
                    "user_id": user_id,
                    "is_new": False,
                }
        except Exception as oauth_err:
            logger.error(f"Google OAuth failed: {oauth_err}")
            raise HTTPException(401, f"Google authentication failed: {str(oauth_err)}")

        raise HTTPException(500, "Google authentication failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(500, str(e))

@router.get("/verify-token")
async def verify_token(user_id: str):
    """التحقق من صحة التوكن (للاستعادة)"""
    try:
        db = get_db()
        profile = db.table("profiles").select("id").eq("id", user_id).execute()
        if profile.data:
            return {"valid": True}
        return {"valid": False}
    except Exception:
        return {"valid": False}

logger.info("✅ Auth Routes v5.0 initialized — Unified Brain integrated")
