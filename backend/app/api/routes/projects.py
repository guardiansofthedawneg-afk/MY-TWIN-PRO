from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["projects"])

@router.get("/projects")
async def get_projects(user_id: str):
    try:
        from app.infrastructure.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        if not client:
            return {"projects": []}
        response = client.table('projects').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(50).execute()
        return {"projects": response.data if response.data else []}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/projects")
async def delete_project(project_id: str):
    try:
        from app.infrastructure.database.supabase_client import get_supabase_client
        client = get_supabase_client()
        if not client:
            raise HTTPException(500, "Database not available")
        client.table('projects').delete().eq('id', project_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(500, str(e))
