
from pathlib import Path
from .storage_protocol import Storage

storage_folder = Path('librarian/storage')
storage_folder.mkdir(parents=True, exist_ok=True)

class FileSystemStorage(Storage):
    def save_file(self, file: bytes, path: str):
        local_path = storage_folder / path
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file)

    def load(self, path: str) -> bytes:
        """"Load a file into memory from the filesystem storage."""
        local_path = storage_folder / path
        with open(local_path, "rb") as f:
            return f.read()
