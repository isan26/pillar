from langchain.agents import create_agent
from dotenv import load_dotenv
import os
from conversation import FileConversation

load_dotenv()

TEXT_ENCODING = "utf-8"
DEFAULT_MODEL = "openai:gpt-5.4"
MODEL = os.getenv("MODEL", DEFAULT_MODEL)

conversation_done = False

conversation_file = FileConversation('./conversations/my-conversation.jsonl')


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
    """Closes the current conversation with the user, it should  be used when the user wants to close the conversation."""
    global conversation_done
    conversation_done = True



agent_config = load_agent();
agent = create_agent(
    model=MODEL,
    system_prompt=agent_config,
    tools=[terminate_conversation_tool],
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
