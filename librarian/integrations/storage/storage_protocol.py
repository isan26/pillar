from typing import Protocol


class Storage(Protocol):
    def save_file(self, file: bytes, path: str):
        ...

    def load(self, path: str) -> bytes:
        ...
