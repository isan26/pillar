from pathlib import Path

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

files = [
    {
        "name": "AI Engineering Guide book",
        "file": BASE_DIR / "ai-engineering-guidebook.pdf",
    },
    {
        "name": "Three fiction stories",
        "file": BASE_DIR / "three_fiction_stories.pdf",
    },
]

documents = []

for item in files:
    loader = PyPDFLoader(str(item["file"]))
    loaded_docs = loader.load()

    for doc in loaded_docs:
        doc.metadata["file_name"] = item["name"]
        doc.metadata["file_path"] = str(item["file"])
        doc.metadata["source_file"] = item["file"].name

    documents.extend(loaded_docs)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

vector_store = PGVector(
    embeddings=embeddings,
    connection="postgresql+psycopg://pillar:pillar@localhost:5434/pillar",
    collection_name="documents",
)

vector_store.add_documents(chunks)
