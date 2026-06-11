from librarian.db.session import get_db
from librarian.db.models.file import File
from librarian.db.operations.job import create_job

def create_file(filename: str, path: str) -> File:
    file = File(filename=filename, path=path)
    db = next(get_db())
    db.add(file)
    db.commit()
    db.refresh(file)
    create_job(file_id=file.id, meta={"filename": filename})
    db.refresh(file)
    return file
