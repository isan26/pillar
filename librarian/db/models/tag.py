from pgvector.sqlalchemy import Vector

from ._base import Base
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String

class Tag(Base):
    __tablename__  = 'tags'

    id : Mapped[int] = mapped_column(primary_key=True)
    name : Mapped[str] = mapped_column(String(255))
    embedding: Mapped[list[float]] = mapped_column(Vector(1536))
