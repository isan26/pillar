from typing import Any, cast
import os

from dotenv import load_dotenv
from langchain.agents import create_agent

from tracer import ConversationTracer, FileConversationTracer, Role


load_dotenv()

TEXT_ENCODING = "utf-8"
DEFAULT_MODEL = "openai:gpt-5.4"
MODEL = os.getenv("MODEL", DEFAULT_MODEL)


def load_agent_prompt() -> str:
    with open("agent.md", "r", encoding=TEXT_ENCODING) as file:
        return file.read()


def pick_response(result: Any) -> tuple[str, object]:
    ai_message = result["messages"][-1]

    content_blocks = getattr(ai_message, "content_blocks", None)
    if content_blocks:
        for block in content_blocks:
            if isinstance(block, dict) and block.get("type") in (None, "text"):
                return block.get("text", ""), ai_message

    content = getattr(ai_message, "content", "")
    if isinstance(content, str):
        return content, ai_message

    return str(content), ai_message


def ask(
    agent: Any,
    tracer: ConversationTracer,
    message: str,
    role: Role = "user",
    purpose: str = "chat_response",
) -> str:
    turn = tracer.start_turn(message)
    tracer.add_message(role, message, turn["turn_id"], source="console")
    run = tracer.start_run(turn["turn_id"], purpose)

    try:
        result = agent.invoke(cast(Any, {"messages": tracer.langchain_messages()}))
        response, ai_message = pick_response(result)
        tracer.complete_run(run, ai_message)
        assistant_message = tracer.add_message(
            "assistant", response, turn["turn_id"], source="model"
        )
        tracer.complete_turn(turn, assistant_message["message_id"])
        return response
    except Exception as error:
        tracer.fail_run(run, error)
        fallback = (
            f"Sorry, the configured model failed: {MODEL}. "
            f"Check the debug logs for details."
        )
        assistant_message = tracer.add_message(
            "assistant", fallback, turn["turn_id"], source="local_error_fallback"
        )
        tracer.fail_turn(turn, error, assistant_message["message_id"])
        return fallback


def main() -> None:
    tracer = FileConversationTracer.start(model=MODEL)
    print(f"Model: {MODEL}")
    print(f"Debug folder: {tracer.session_path}")

    conversation_done = {"value": False}

    def terminate_conversation_tool() -> None:
        """Closes the current conversation with the user, it should be used when the user wants to close the conversation."""
        conversation_done["value"] = True

    agent = create_agent(
        model=MODEL,
        system_prompt=load_agent_prompt(),
        tools=[terminate_conversation_tool],
    )

    hello_message = ask(
        agent,
        tracer,
        "Say hello and introduce yourself, expect interaction from the user.",
        "system",
        "greeting",
    )
    print(hello_message)

    while not conversation_done["value"]:
        user_message = input("Ask: ")
        response = ask(agent, tracer, user_message)
        print(response)

    tracer.close()
    print("Conversation closed:")


if __name__ == "__main__":
    main()
