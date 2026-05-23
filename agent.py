from langchain.agents import create_agent
from dotenv import load_dotenv
import os

load_dotenv()

messages = []
conversation_done = False


def load_agent() -> str:
    with open("agent.md","r") as agent_config:
        return agent_config.read()

def ask_to_agent(question: str, role="user") -> str:
    messages.append({"role": role, "content": question})
    result = agent.invoke({"messages": messages})
    response = result["messages"][-1].content_blocks[0]["text"]
    messages.append({"role": "assistant", "content": response})

    return response


def terminate_conversation_tool():
    """Closes the current conversation with the user, it should  be used when the user wants to close the conversation."""
    global conversation_done
    conversation_done = True
    conversation = ""
    for message in messages:
        conversation += f"({message["role"]}): {message["content"]} \n"

    with open("conversation.txt", "w") as file:
        file.write(conversation)

agent_config = load_agent();
agent = create_agent(
    model="openai:gpt-5.4",
    system_prompt=agent_config,
    tools=[terminate_conversation_tool],
)
result = agent.invoke({"messages": messages})
hello_message = ask_to_agent(
    "Say hello and introduce yourself, expect interaction from the user.", "system"
)
print(hello_message)

while True:
    if conversation_done:
        break
    user_message = input("Ask: ")
    response = ask_to_agent(user_message)
    print(response)

print("Conversation closed:")
