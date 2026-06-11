from librarian.db.session import get_db
from librarian.db.models.job import Job, StatusEnum

def create_job(file_id: int, meta: dict) -> Job:
    db = next(get_db())
    new_job = Job(file_id=file_id, status=StatusEnum.PENDING, meta=meta)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


def get_job(job_id: int) -> Job:
    db = next(get_db())
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError(f"Job with id {job_id} not found")
    return job

def update_job_status(job_id: int, status: StatusEnum) -> Job:
    db = next(get_db())
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError(f"Job with id {job_id} not found")
    
    job.status = status
    db.commit()
    db.refresh(job)
    return job

def execute_job(job_id: int) -> Job:
    db = next(get_db())
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError(f"Job with id {job_id} not found")
    
    job.status = StatusEnum.IN_PROGRESS
    db.commit()
    db.refresh(job)

    # Simulate job execution logic here
    # For example, you could process the file associated with the job
    # and update the job status accordingly

    # For demonstration, we'll just mark it as completed
    job.status = StatusEnum.COMPLETED
    db.commit()
    db.refresh(job)
    
    return job
