from ._base import Base
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String

class Book(Base):
    __tablename__  = 'books'

    id : Mapped[int] = mapped_column(primary_key=True)
    title : Mapped[str] = mapped_column(String(255))
    isbn : Mapped[str] = mapped_column(String(20))
    file_path : Mapped[str] = mapped_column()
