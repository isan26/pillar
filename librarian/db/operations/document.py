from librarian.db.models.document import Document


def create_document(db, document_data):
    ...


# Basic snippet, an embedding strategy is needed to avoid using OpenAI's directly
# from langchain_openai import OpenAIEmbeddings

# embeddings = OpenAIEmbeddings()

# vector = embeddings.embed_query(chunk_text)

# document = DocumentModel(
#     content=chunk_text,
#     embedding=vector,
#     job_id=job.id,
#     file_id=file.id,
# )

# session.add(document)
# session.commit()
