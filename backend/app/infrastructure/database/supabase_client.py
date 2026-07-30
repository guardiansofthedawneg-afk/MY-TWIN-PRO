import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

logger = logging.getLogger("supabase_client")
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL:
    logger.critical("❌ SUPABASE_URL not set!")
    raise RuntimeError("SUPABASE_URL is required")

if not SUPABASE_SERVICE_ROLE_KEY:
    logger.warning("⚠️ SUPABASE_SERVICE_KEY not set. RLS policies may block operations.")

# ✅ عميل الخدمة (Service Role) — يتجاوز RLS بالكامل
_service_role_db: Client | None = None

def get_service_role_db() -> Client:
    global _service_role_db
    if _service_role_db is None and SUPABASE_SERVICE_ROLE_KEY:
        _service_role_db = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("✅ Supabase service_role client created successfully")
    return _service_role_db

# ✅ عميل عادي (للتوافق)
def get_db() -> Client:
    return get_service_role_db()

logger.info("✅ Supabase client configured")
