from io import BytesIO
from librarian.db.models.document import Document
from pypdf import PdfReader
from librarian.db.models.job import Job
from langchain_text_splitters import RecursiveCharacterTextSplitter
from librarian.integrations.vector import vectorize

def pdf_bytes_to_documents(pdf_bytes: bytes, job: Job) -> list[Document]:
    reader = PdfReader(BytesIO(pdf_bytes))
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    documents= []
    for page_number, page in enumerate(reader.pages):
        page_text = page.extract_text()
        total_pages = len(reader.pages)
        print(f"Processing page {page_number + 1} of {total_pages} for job {job.id}")

        for chunk in splitter.split_text(page_text):
            embedding = vectorize(chunk)
            documents.append(
                Document(
                    content=chunk,
                    embedding=embedding,
                    page_number=page_number,
                    job_id=job.id,
                    file_id=job.file_id,
                )
            )

    return documents
