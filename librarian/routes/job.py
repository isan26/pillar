from fastapi import APIRouter
from librarian.logic.job.execute import execute_job


job_router = APIRouter(prefix="/job", tags=["jobs"])
@job_router.get("/{jobid}/execute")
def execute_job_endpoint(jobid: str):
    result = execute_job(jobid)
    return result
