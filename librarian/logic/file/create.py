from librarian.integrations.storage import default_storage
from librarian.db.models.file import File
from librarian.db.operations.file import create_file


def store_file(file: bytes, filename: str) -> "File":
    path = f"{filename}"
    default_storage.save_file(file, path)
    file_record = create_file(filename=filename, path=path)
    return file_record


   