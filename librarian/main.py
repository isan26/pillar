from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from librarian.routes.file import file_router
from librarian.routes.job import job_router
from dotenv import load_dotenv


app = FastAPI()

app.include_router(file_router)
app.include_router(job_router)

@app.get("/")
def main():
    return "It works"
