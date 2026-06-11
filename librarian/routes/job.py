from fastapi import APIRouter
from librarian.logic.job.execute import execute_job
from librarian.db.session import get_db

job_router = APIRouter(prefix="/job", tags=["jobs"])
@job_router.get("/{job_id}/execute")
def execute_job_endpoint(job_id: int):
    db = next(get_db())
    result = execute_job(db,job_id)
    return {"result": result}
