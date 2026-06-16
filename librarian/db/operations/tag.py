from librarian.db.models.tag import Tag
from sqlalchemy.orm import Session

def create_tag(db: Session, name: str, embedding: str) -> Tag:
    tag = Tag(name=name, embedding=embedding)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
