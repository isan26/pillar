from argparse import ArgumentParser
from pathlib import Path
from typing import Any, cast
import os

from dotenv import load_dotenv
from langchain.agents import create_agent

from tracer import ConversationTracer, FileConversationTracer, Role


load_dotenv()

TEXT_ENCODING = "utf-8"
DEFAULT_MODEL = "openai:gpt-5.4"
DEFAULT_AGENT_FILE = Path("agent.md")
AGENTS_DIR = Path("agents")


def parse_cli() -> tuple[str | None, str | None]:
    parser = ArgumentParser(description="Run the conversational agent.")
    parser.add_argument("--agent", default=None, help="Agent name (e.g. agent-optimist-v1)")
    parser.add_argument("--model", default=None, help="Model id (e.g. openai:gpt-5-mini)")
    args = parser.parse_args()
    return args.agent, args.model


def resolve_agent_prompt(name: str | None) -> tuple[str, str]:
    """Return (prompt_body, source_path) for the named agent.

    Lookup order when name is given: agents/<name>/prompt.md, then
    agents/test/<name>/prompt.md. Raises FileNotFoundError if neither exists.
    When name is None, returns the root agent.md.
    """
    if name is None:
        return DEFAULT_AGENT_FILE.read_text(encoding=TEXT_ENCODING), str(DEFAULT_AGENT_FILE)

    candidates = [
        AGENTS_DIR / name / "prompt.md",
        AGENTS_DIR / "test" / name / "prompt.md",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.read_text(encoding=TEXT_ENCODING), str(candidate)

    tried = ", ".join(str(candidate) for candidate in candidates)
    raise FileNotFoundError(f"agent '{name}' not found; tried: {tried}")


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
    model: str,
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
            f"Sorry, the configured model failed: {model}. "
            f"Check the debug logs for details."
        )
        assistant_message = tracer.add_message(
            "assistant", fallback, turn["turn_id"], source="local_error_fallback"
        )
        tracer.fail_turn(turn, error, assistant_message["message_id"])
        return fallback


def main() -> None:
    cli_agent, cli_model = parse_cli()
    agent_name = cli_agent or os.getenv("AGENT")
    model = cli_model or os.getenv("MODEL", DEFAULT_MODEL)

    prompt, prompt_source = resolve_agent_prompt(agent_name)

    tracer = FileConversationTracer.start(model=model, agent=agent_name)
    print(f"Model: {model}")
    print(f"Agent: {agent_name or '(default agent.md)'}  ({prompt_source})")
    print(f"Debug folder: {tracer.session_path}")

    conversation_done = {"value": False}

    def terminate_conversation_tool() -> None:
        """Closes the current conversation with the user, it should be used when the user wants to close the conversation."""
        conversation_done["value"] = True

    agent = create_agent(
        model=model,
        system_prompt=prompt,
        tools=[terminate_conversation_tool],
    )

    hello_message = ask(
        agent,
        tracer,
        model,
        "Say hello and introduce yourself, expect interaction from the user.",
        "system",
        "greeting",
    )
    print(hello_message)

    while not conversation_done["value"]:
        user_message = input("Ask: ")
        response = ask(agent, tracer, model, user_message)
        print(response)

    tracer.close()
    print("Conversation closed:")


if __name__ == "__main__":
    main()
