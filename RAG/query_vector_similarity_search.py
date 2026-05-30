from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector

from dotenv import load_dotenv
load_dotenv()


#Embedding model
embeddings = OpenAIEmbeddings(
    model = "text-embedding-3-small"
)

#Connection to postgres
store = PGVector(
    embeddings=embeddings,
    connection="postgresql+psycopg://pillar:pillar@localhost:5434/pillar",
    collection_name="documents"  # A collection is like a category, this is used by langchain internally
)

question = input("Ask your question: ")
results = store.similarity_search_with_score(
question,
k=5 #how many documents to return
)


for doc, score in results:
    print(f"Score: {score}")
    print(f"Source: {doc.metadata}")
    print(doc.page_content)
    print("-" * 80)
