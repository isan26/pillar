from langchain_postgres import PGVector
from librarian.db.engine import connection_string

def pg_vector_store(embeddings, collection_name="documents"):
    return PGVector(
        embeddings=embeddings,
        connection= connection_string,
        collection_name=collection_name,
    )
