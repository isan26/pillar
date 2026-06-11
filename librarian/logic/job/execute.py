from librarian.db.models.job import StatusEnum, get_job, update_job_status
from librarian.integrations.storage import default_storage
from librarian.integrations.document import load_documents_from_file
from librarian.integrations.llm import vectorization


def execute_job(jobid: int):
    job = get_job(jobid)
    if job.status != StatusEnum.PENDING:
        raise ValueError(f"Job {jobid} is not in pending status")
    
    update_job_status(jobid, StatusEnum.IN_PROGRESS)

    file_path = job.file.path
    if not file_path:
        update_job_status(jobid, StatusEnum.FAILED)
        raise ValueError(f"Job {jobid} does not have a valid file path")
    
    
    document = default_storage.load(file_path)
    documents = load_documents_from_file(document, job)
    vectorization(documents)

    update_job_status(jobid, StatusEnum.COMPLETED)
 
    return True;
