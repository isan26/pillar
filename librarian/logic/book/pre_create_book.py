from pydantic import BaseModel
from librarian.db.models.book import Book
from librarian.db.operations.document import load_document_pages
from sqlalchemy.orm import Session
from librarian.integrations.llm import suggest_tags


class BookInput(BaseModel):
    title: str
    isbn: str | None = None
    file_id: int
    pages_to_scan: str


def pre_create_book(db: Session, input: BookInput) -> dict:
    pages = _pages_interval_to_list(input.pages_to_scan)
    document_content = load_document_pages(db,input.file_id, pages)
    suggested_tags = suggest_tags(document_content)

    return {
        "title": input.title,
        "isbn": input.isbn,
        "file_id": input.file_id,
        "suggested_tags": suggested_tags,
    }


def _pages_interval_to_list(pages_interval: str) -> list[int]:
    # Convert a string like "1-3,5,7-9" into a list of page numbers
    pages = []
    intervals = pages_interval.split(',')
    for interval in intervals:
        if '-' in interval:
            start, end = map(int, interval.split('-'))
            pages.extend(range(start, end + 1))
        else:
            pages.append(int(interval))
    return pages
