from librarian.db.models.job import Job
from librarian.db.models.file import File
from .pdf import pdf_bytes_to_documents
from langchain_core.documents import Document


def load_documents_from_file(file_bytes: bytes, job: Job) -> list[Document]:
    file_name = job.file.path
    if file_name.lower().endswith(".pdf"):
        documents = pdf_bytes_to_documents(file_bytes, job)
        return documents
    
    raise ValueError(f"Unsupported file type for {file_name}")
