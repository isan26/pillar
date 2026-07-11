from pydantic import BaseModel
from librarian.db.models.tag import Tag
from sqlalchemy.orm import Session
from sqlalchemy import select

SIMILARITY_THRESHOLD = 0.95


# Pending, need to implement a similarity check function
def get_or_create_tags(db: Session, tags: list[str]) -> list[int]:
    tag_ids = []
    return tag_ids
