from .filesystem import FileSystemStorage

default_storage = FileSystemStorage()

__all__ = ["default_storage", "FileSystemStorage"]
