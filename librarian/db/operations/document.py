from librarian.db.models.document import Document
from sqlalchemy.orm import Session
from sqlalchemy import select

def load_document_pages(db: Session,file_id: int, pages: list[int]) -> str:
    stmt = select(Document.content).where(Document.file_id == file_id, Document.page_number.in_(pages))
    result = db.execute(stmt)
    documents = result.scalars().all()
    return "\n".join(documents)
