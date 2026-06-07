from ._base import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from librarian.db.session import get_db


class BookTag(Base):
    __tablename__  = 'book_tags'

    book_id : Mapped[int] = mapped_column(
        ForeignKey("books.id"),
        primary_key=True
    )
    tag_id : Mapped[int] = mapped_column(
        ForeignKey("tags.id"),
        primary_key=True
    )
    confidence: Mapped[float]
