from langchain_openai import OpenAIEmbeddings

embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")

def openai_vectorization(chunk : str) -> list[float]:
    return embedding_model.embed_query(chunk)
