from ._base import Base
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String
from librarian.db.session import get_db

class Tag(Base):
    __tablename__  = 'tags'

    id : Mapped[int] = mapped_column(primary_key=True)
    name : Mapped[str] = mapped_column(String(255))

def create_tag(name: str, type: str) -> Tag:
    tag = Tag(name=name, type=type)
    db = next(get_db())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
