import os
import logging

logger = logging.getLogger("supabase_client")

# عميل Supabase الأساسي
_supabase_client = None

def get_db():
    """يُرجع عميل Supabase. يُنشئه إذا لم يكن موجوداً."""
    global _supabase_client
    if _supabase_client is None:
        try:
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
            
            if not url or not key:
                logger.error("❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables")
                raise Exception("Supabase credentials not configured")
            
            _supabase_client = create_client(url, key)
            logger.info("✅ Supabase client created successfully")
        except Exception as e:
            logger.error(f"❌ Failed to create Supabase client: {e}")
            raise
    return _supabase_client

# عميل Supabase مع Service Role (يتجاوز RLS)
_service_role_client = None

def get_service_role_db():
    """يُرجع عميل Supabase مع صلاحيات service_role. يُنشئه إذا لم يكن موجوداً."""
    global _service_role_client
    if _service_role_client is None:
        try:
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not url or not key:
                logger.warning("⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Using regular client.")
                return get_db()
            
            _service_role_client = create_client(url, key)
            logger.info("✅ Supabase service_role client created successfully")
        except Exception as e:
            logger.error(f"❌ Failed to create service_role client: {e}")
            return get_db()
    return _service_role_client
