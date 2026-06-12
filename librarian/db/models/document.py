from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from pgvector.sqlalchemy import Vector
from .job import Job
from .file import File
from ._base import Base
from uuid import uuid4, UUID

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    content: Mapped[str]

    embedding: Mapped[list[float]] = mapped_column(Vector(1536))

    page_number: Mapped[int] = mapped_column()

    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id")
    )

    file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id")
    )

    job: Mapped["Job"] = relationship("Job")
    file: Mapped["File"] = relationship("File")
