from langchain.agents import create_agent
from dotenv import load_dotenv
import os
from conversation import FileConversation
from langchain_postgres import PGVector 
from langchain_openai import OpenAIEmbeddings

load_dotenv()

TEXT_ENCODING = "utf-8"
DEFAULT_MODEL = "openai:gpt-5.4"
MODEL = os.getenv("MODEL", DEFAULT_MODEL)

conversation_done = False
conversation_file = FileConversation('./conversations/my-conversation.jsonl')

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)
store=PGVector(
    embeddings=embeddings,
    connection="postgresql+psycopg://pillar:pillar@localhost:5434/pillar",
    collection_name="documents"
)

def load_agent() -> str:
    with open("agent.md", "r", encoding=TEXT_ENCODING) as agent_config:
        return agent_config.read()

def ask_to_agent_with_conversation(question: str, role="user") -> str:
    conversation_file.append({"content": question, "role": role})
    result = agent.invoke({"messages":conversation_file.load()})
    response = result["messages"][-1].content_blocks[0]["text"]
    conversation_file.append({"content": response, "role": 'assistant'})
    return response


def terminate_conversation_tool():
    """End the current conversation when the user clearly wants to stop, exit, or say goodbye. 
    Use this only after confirming the user intends to finish the chat."""
    global conversation_done
    conversation_done = True

def rag_search(question:str):
    """Search the vector database for relevant document excerpts related to the user's question. 
      Use this when the answer may depend on uploaded documents or external reference material. 
      Returns retrieved text passages, not a final answer."""
    print("RAG TOOL CALLED:")
    print(question)
    print("---"*10)
    data = store.similarity_search(question, k=5)
    result = "\n\n".join(doc.page_content for doc in data)
    return result


agent_config = load_agent();
agent = create_agent(
    model=MODEL,
    system_prompt=agent_config,
    tools=[terminate_conversation_tool, rag_search],
)
hello_message = ask_to_agent_with_conversation(
    "Say hello and introduce yourself, expect interaction from the user. Don't close the conversation immediately, wait for the user to ask after this message ", "system"
)
print(hello_message)

while True:
    if conversation_done:
        break
    user_message = input("Ask: ")
    response = ask_to_agent_with_conversation(user_message)
    print(response)

conversation_file.close()
print("Conversation closed:")
