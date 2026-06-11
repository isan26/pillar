from ._base import Base
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import ForeignKey
from librarian.db.session import get_db
from enum import Enum
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import JSONB
from librarian.db.session import get_db
from librarian.db.models.file import File

class StatusEnum(str,Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Job(Base):
    __tablename__ = 'jobs'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    status: Mapped[StatusEnum] = mapped_column(SqlEnum(StatusEnum), default=StatusEnum.PENDING)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id"))
    meta: Mapped[dict] = mapped_column(JSONB)
    file: Mapped["File"] = relationship("File")
