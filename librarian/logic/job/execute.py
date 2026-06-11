from librarian.db.models.job import StatusEnum
from sqlalchemy.orm import Session
from librarian.db.operations.job import  get_job, update_job_status
from librarian.integrations.storage import default_storage
from librarian.integrations.document import load_documents_from_file
from librarian.integrations.llm import vectorization


def execute_job(db: Session, job_id: int):
    job = get_job(db, job_id)
    if job.status != StatusEnum.PENDING:
        raise ValueError(f"Job {job_id} is not in pending status")
    
    update_job_status(db,job_id, StatusEnum.IN_PROGRESS)

    file_path = job.file.path
    if not file_path:
        update_job_status(db,job_id, StatusEnum.FAILED)
        raise ValueError(f"Job {job_id} does not have a valid file path")
    
    try:
        document = default_storage.load(file_path)
        documents = load_documents_from_file(document, job)
        vectorization(documents)

        update_job_status(db, job_id, StatusEnum.COMPLETED)
        return True
    except Exception as e:
        update_job_status(db, job_id, StatusEnum.FAILED)
        raise e
