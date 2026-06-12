from librarian.db.models.job import StatusEnum
from sqlalchemy.orm import Session
from librarian.db.operations.job import  get_job, update_job_status
from librarian.integrations.storage import default_storage
from librarian.integrations.document import load_documents_from_file


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
        print(f"Loading document from {file_path} for job {job_id}")
        document = default_storage.load(file_path)
        
        print(f"Document loaded successfully for job {job_id}, now processing...")
        documents = load_documents_from_file(document, job)

        print(f"Document processed successfully for job {job_id}, now saving to database...")
        db.add_all(documents)
        db.commit()

        update_job_status(db, job_id, StatusEnum.COMPLETED)
        return True
    except Exception as e:
        update_job_status(db, job_id, StatusEnum.FAILED)
        raise e
