from io import BytesIO
from langchain_core.documents import Document
from pypdf import PdfReader
from librarian.db.models.job import Job

def pdf_bytes_to_documents(pdf_bytes: bytes, job: Job) -> list[Document]:
    reader = PdfReader(BytesIO(pdf_bytes))

    documents = []

    for page_number, page in enumerate(reader.pages):
        documents.append(
            Document(
                page_content=page.extract_text() or "",
                metadata={
                    "page": page_number + 1,
                    "source_file": job.file.path,
                },
                file_id=job.file.id,
                job_id=job.id
            )
        )

    return documents
