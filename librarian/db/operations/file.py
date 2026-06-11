from sqlalchemy.orm import Session
from librarian.db.models.file import File
from librarian.db.operations.job import create_job

def create_file(db: Session, filename: str, path: str) -> File:
    file = File(filename=filename, path=path)
    db.add(file)
    db.commit()
    db.refresh(file)
    create_job(db, file_id=file.id, meta={"filename": filename})
    db.refresh(file)
    return file
