
from pydantic import BaseModel
from librarian.db.models.tag import Tag
from librarian.db.models.book import Book
from librarian.db.models.book_tag import BookTag
from librarian.db.operations.document import load_document_pages
from sqlalchemy.orm import Session
from librarian.integrations.llm import suggest_tags


class BookInput(BaseModel):
    title: str
    isbn: str | None = None
    file_id: int
    tags: list[str] | None = None


def create_book(db: Session, input: BookInput, tags : list[str]) -> Book:
    book = Book(**input.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)

    return book


def associate_tags_with_book(db: Session, book: Book, tags: list[int]) -> None:
    for tag_id in tags:
        book_tag = BookTag(book_id=book.id, tag_id=tag_id)
        db.add(book_tag)

    db.commit()
