from langchain_openai import OpenAIEmbeddings
import psycopg

#Important to load the openai key from .env
from dotenv import load_dotenv
load_dotenv()

"""
This file only queries the vector db given a term, it should be ran after the import files script so the DB
get's the content. No Agent is present here, just a basic querying.

We need to use the embedding model to be able to translate the term into a vector
"""

embeddings = OpenAIEmbeddings(
    model = "text-embedding-3-small"
)

conn = psycopg.connect("postgresql://pillar:pillar@localhost:5434/pillar")


while True:
    question = input("> ")

    if question.lower() in {"quit", "exit"}:
        break

    embedding = embeddings.embed_query(question)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                document,
                cmetadata,
                embedding <=> %s::vector AS distance
            FROM langchain_pg_embedding
            ORDER BY embedding <=> %s::vector
            LIMIT 5
            """,
            (embedding, embedding),
        )

        rows = cur.fetchall()

    print("\nTop Matches:\n")

    for document, metadata, distance in rows:
        print(f"Distance: {distance:.4f}")
        print(document[:500])
        print("-" * 80)
