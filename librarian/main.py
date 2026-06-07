from fastapi import FastAPI
from librarian.routes.file import file_router

app = FastAPI()

app.include_router(file_router)

@app.get("/")
def main():
    return "It works"
