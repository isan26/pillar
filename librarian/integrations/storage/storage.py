from typing import Protocol


class Storage(Protocol):
    def upload():
        ...

    def download():
        ...    
