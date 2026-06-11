from ._base import Base
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import String, DateTime
from datetime import datetime, UTC
from librarian.db.session import get_db


class File(Base):
    __tablename__  = 'files'

    id : Mapped[int] = mapped_column(primary_key=True)
    filename : Mapped[str] = mapped_column(String(255))
    path : Mapped[str] = mapped_column(String(255))
    created_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(UTC))


