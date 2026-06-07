from fastapi import APIRouter, HTTPException, UploadFile, File
from librarian.logic.file.create import store_file
file_router = APIRouter(prefix="/file", tags=["files"])

@file_router.get("/")
def get_files():
    return {"message": "List of files in the library"}


@file_router.post("/")
def add_file(
    file : UploadFile = File(..., description="The file to upload")
):
    if file.filename is None:
        raise HTTPException(status_code=400, detail="No file uploaded. Please upload a file.")
    
    if not file.filename.endswith(('.pdf', '.PDF')):
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF file.")
    
    file_record = store_file(file.file.read(), file.filename)
    return file_record

@file_router.get("/{file_id}")
def get_file_details(file_id: int):
    return {"message": f"Details of file with id {file_id}"}

@file_router.put("/{file_id}")
def update_file(file_id: int):
    return {"message": f"File with id {file_id} updated successfully"}


@file_router.delete("/{file_id}")
def delete_file(file_id: int):
    return {"message": f"File with id {file_id} deleted successfully"}
