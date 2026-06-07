from typing import Protocol


class Storage(Protocol):
    def save_file(self, file: bytes, path: str):
        ...

    def download(self, path: str) -> bytes:
        ...
