from ._base import Base
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import ForeignKey, String
from .file import File

class Book(Base):
    __tablename__  = 'books'

    id : Mapped[int] = mapped_column(primary_key=True)
    title : Mapped[str] = mapped_column(String(255))
    isbn : Mapped[str | None] = mapped_column(String(20), nullable=True)
    file_id: Mapped[int] = mapped_column(
        ForeignKey('files.id', ondelete='RESTRICT'),
        nullable=False
    )
    file: Mapped[File] = relationship()

