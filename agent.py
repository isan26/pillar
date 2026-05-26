from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Any, cast
import json
import os
import uuid

from dotenv import load_dotenv
from langchain.agents import create_agent

load_dotenv()

TEXT_ENCODING = "utf-8"
DEFAULT_MODEL = "openai:gpt-5.4"
MODEL = os.getenv("MODEL", DEFAULT_MODEL)
DEBUG_DIR = Path(os.getenv("DEBUG_DIR", "debug"))
MODEL_INPUT_PRICE_PER_1M_TOKENS = os.getenv("MODEL_INPUT_PRICE_PER_1M_TOKENS")
MODEL_OUTPUT_PRICE_PER_1M_TOKENS = os.getenv("MODEL_OUTPUT_PRICE_PER_1M_TOKENS")
SENSITIVE_KEY_PARTS = (
    "api_key",
    "apikey",
    "authorization",
    "bearer",
    "cookie",
    "password",
    "secret",
    "access_token",
    "refresh_token",
    "client_secret",
)

messages = []
turns = []
runs = []
conversation_done = False
turn_counter = 0
run_counter = 0


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def create_session() -> dict:
    session_id = uuid.uuid4().hex[:8]
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    session_path = DEBUG_DIR / "conversations" / f"{timestamp}-{session_id}"
    session_path.mkdir(parents=True, exist_ok=True)

    return {
        "session_id": session_id,
        "model": MODEL,
        "debug_path": str(session_path),
        "path": session_path,
        "started_at": utc_now(),
        "completed_at": None,
        "status": "running",
        "total_input_tokens": None,
        "total_output_tokens": None,
        "total_tokens": None,
        "estimated_cost_usd": None,
    }


session = create_session()


def is_sensitive_key(key: str) -> bool:
    key_lower = key.lower()
    if any(part in key_lower for part in SENSITIVE_KEY_PARTS):
        return True

    return key_lower == "token" or key_lower.endswith("_token") or key_lower.endswith("-token")


def sanitize_for_logging(value: Any) -> Any:
    if isinstance(value, dict):
        cleaned = {}
        for key, item in value.items():
            key_string = str(key)
            if is_sensitive_key(key_string):
                cleaned[key] = "[REDACTED]"
            else:
                cleaned[key] = sanitize_for_logging(item)
        return cleaned

    if isinstance(value, list):
        return [sanitize_for_logging(item) for item in value]

    return value


def to_jsonable(value: Any) -> Any:
    value = sanitize_for_logging(value)

    if isinstance(value, (str, int, float, bool)) or value is None:
        return value

    if isinstance(value, Path):
        return str(value)

    if isinstance(value, dict):
        return {str(key): to_jsonable(item) for key, item in value.items()}

    if isinstance(value, (list, tuple)):
        return [to_jsonable(item) for item in value]

    if hasattr(value, "model_dump"):
        return to_jsonable(value.model_dump())

    return str(value)


def session_file(name: str) -> Path:
    return session["path"] / name


def save_json(name: str, payload) -> None:
    with open(session_file(name), "w", encoding=TEXT_ENCODING) as file:
        json.dump(to_jsonable(payload), file, ensure_ascii=False, indent=2)
        file.write("\n")


def save_jsonl(name: str, payload) -> None:
    with open(session_file(name), "a", encoding=TEXT_ENCODING) as file:
        file.write(json.dumps(to_jsonable(payload), ensure_ascii=False) + "\n")


def append_event(event_type: str, **metadata) -> None:
    event = {
        "session_id": session["session_id"],
        "event_type": event_type,
        "timestamp": utc_now(),
        **metadata,
    }
    save_jsonl("events.jsonl", event)


def save_session() -> None:
    payload = {key: value for key, value in session.items() if key != "path"}
    save_json("session.json", payload)


def save_messages() -> None:
    save_json("messages.json", messages)


def save_turns() -> None:
    save_json("turns.json", turns)


def save_runs() -> None:
    save_json("runs.json", runs)


def save_conversation_markdown() -> None:
    lines = [
        "# Conversation",
        "",
        f"Session: {session['session_id']}",
        f"Model: {MODEL}",
        f"Started: {session['started_at']}",
        "",
    ]

    for message in messages:
        role = message["role"].title()
        turn_id = message.get("turn_id") or "session"
        lines.extend(
            [
                f"## {role} - {turn_id}",
                "",
                message["content"],
                "",
            ]
        )

    with open(session_file("conversation.md"), "w", encoding=TEXT_ENCODING) as file:
        file.write("\n".join(lines))


def save_all() -> None:
    save_session()
    save_messages()
    save_turns()
    save_runs()
    save_conversation_markdown()


def next_turn_id() -> str:
    global turn_counter
    turn_counter += 1
    return f"turn_{turn_counter:03d}"


def next_run_id() -> str:
    global run_counter
    run_counter += 1
    return f"run_{run_counter:03d}"


def parse_optional_float(value: str | None) -> float | None:
    if value is None or value.strip() == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


def to_optional_int(value: Any) -> int | None:
    if isinstance(value, bool) or value is None:
        return None

    if isinstance(value, int):
        return value

    if isinstance(value, float) and value.is_integer():
        return int(value)

    return None


def calculate_cost(input_tokens: int | None, output_tokens: int | None) -> float | None:
    input_price = parse_optional_float(MODEL_INPUT_PRICE_PER_1M_TOKENS)
    output_price = parse_optional_float(MODEL_OUTPUT_PRICE_PER_1M_TOKENS)

    if (
        input_tokens is None
        or output_tokens is None
        or input_price is None
        or output_price is None
    ):
        return None

    input_cost = input_tokens / 1_000_000 * input_price
    output_cost = output_tokens / 1_000_000 * output_price

    return round(input_cost + output_cost, 8)


def extract_usage(ai_message: Any) -> dict[str, Any]:
    usage_metadata = to_jsonable(getattr(ai_message, "usage_metadata", None) or {})
    response_metadata = to_jsonable(getattr(ai_message, "response_metadata", None) or {})

    if not isinstance(usage_metadata, dict):
        usage_metadata = {}

    if not isinstance(response_metadata, dict):
        response_metadata = {}

    input_tokens = to_optional_int(usage_metadata.get("input_tokens"))
    output_tokens = to_optional_int(usage_metadata.get("output_tokens"))
    total_tokens = to_optional_int(usage_metadata.get("total_tokens"))

    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "estimated_cost_usd": calculate_cost(input_tokens, output_tokens),
        "raw_usage_metadata": usage_metadata,
        "raw_response_metadata": response_metadata,
    }


def update_session_totals() -> None:
    input_total = 0
    output_total = 0
    token_total = 0
    cost_total = 0
    has_input = False
    has_output = False
    has_tokens = False
    has_cost = False

    for run in runs:
        if run.get("input_tokens") is not None:
            input_total += run["input_tokens"]
            has_input = True
        if run.get("output_tokens") is not None:
            output_total += run["output_tokens"]
            has_output = True
        if run.get("total_tokens") is not None:
            token_total += run["total_tokens"]
            has_tokens = True
        if run.get("estimated_cost_usd") is not None:
            cost_total += run["estimated_cost_usd"]
            has_cost = True

    session["total_input_tokens"] = input_total if has_input else None
    session["total_output_tokens"] = output_total if has_output else None
    session["total_tokens"] = token_total if has_tokens else None
    session["estimated_cost_usd"] = round(cost_total, 8) if has_cost else None


def append_message(role: str, content: str, turn_id: str | None, source: str = "user") -> dict:
    message = {
        "session_id": session["session_id"],
        "message_id": f"msg_{len(messages) + 1:03d}",
        "turn_id": turn_id,
        "role": role,
        "content": content,
        "source": source,
        "created_at": utc_now(),
    }
    messages.append(message)
    save_messages()
    save_conversation_markdown()
    append_event(f"{role}_message_saved", message_id=message["message_id"], turn_id=turn_id)

    return message


def langchain_messages() -> list[dict]:
    return [{"role": message["role"], "content": message["content"]} for message in messages]


def get_response_text(result) -> tuple[str, object]:
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


def create_turn(user_message: str) -> dict:
    turn_id = next_turn_id()
    turn = {
        "session_id": session["session_id"],
        "turn_id": turn_id,
        "status": "running",
        "started_at": utc_now(),
        "completed_at": None,
        "latency_ms": None,
        "user_message": user_message,
        "assistant_message_id": None,
        "error_type": None,
        "error_message": None,
    }
    turns.append(turn)
    save_turns()
    append_event("turn_started", turn_id=turn_id)

    return turn


def complete_turn(turn: dict, status: str, started: float, error: Exception | None = None) -> None:
    turn["status"] = status
    turn["completed_at"] = utc_now()
    turn["latency_ms"] = round((perf_counter() - started) * 1000)

    if error is not None:
        turn["error_type"] = type(error).__name__
        turn["error_message"] = str(error)

    save_turns()
    append_event(f"turn_{status}", turn_id=turn["turn_id"])


def create_run(turn_id: str | None, purpose: str) -> dict:
    run = {
        "session_id": session["session_id"],
        "run_id": next_run_id(),
        "turn_id": turn_id,
        "provider": MODEL.split(":", 1)[0] if ":" in MODEL else None,
        "model": MODEL,
        "purpose": purpose,
        "status": "running",
        "started_at": utc_now(),
        "completed_at": None,
        "input_tokens": None,
        "output_tokens": None,
        "total_tokens": None,
        "latency_ms": None,
        "estimated_cost_usd": None,
        "raw_usage_metadata": {},
        "raw_response_metadata": {},
        "error_type": None,
        "error_message": None,
    }
    runs.append(run)
    save_runs()
    append_event("llm_run_started", run_id=run["run_id"], turn_id=turn_id, purpose=purpose)

    return run


def complete_run(run: dict, started: float, ai_message) -> None:
    usage = extract_usage(ai_message)
    run.update(
        {
            "status": "success",
            "completed_at": utc_now(),
            "latency_ms": round((perf_counter() - started) * 1000),
            **usage,
        }
    )
    update_session_totals()
    save_runs()
    save_session()
    append_event("llm_run_completed", run_id=run["run_id"], turn_id=run["turn_id"])


def fail_run(run: dict, started: float, error: Exception) -> None:
    run.update(
        {
            "status": "error",
            "completed_at": utc_now(),
            "latency_ms": round((perf_counter() - started) * 1000),
            "error_type": type(error).__name__,
            "error_message": str(error),
        }
    )
    save_runs()
    append_event("llm_run_failed", run_id=run["run_id"], turn_id=run["turn_id"])


def load_agent() -> str:
    with open("agent.md", "r", encoding=TEXT_ENCODING) as agent_config:
        return agent_config.read()


def ask_to_agent(question: str, role: str = "user", purpose: str = "chat_response") -> str:
    turn_started = perf_counter()
    turn = create_turn(question)
    append_message(role, question, turn["turn_id"], source="console")

    run_started = perf_counter()
    run = create_run(turn["turn_id"], purpose)

    try:
        result = agent.invoke(cast(Any, {"messages": langchain_messages()}))
        response, ai_message = get_response_text(result)
        complete_run(run, run_started, ai_message)
        assistant_message = append_message("assistant", response, turn["turn_id"], source="model")
        turn["assistant_message_id"] = assistant_message["message_id"]
        complete_turn(turn, "completed", turn_started)

        return response
    except Exception as error:
        fail_run(run, run_started, error)
        fallback = f"Sorry, the configured model failed: {MODEL}. Check the debug logs for details."
        assistant_message = append_message(
            "assistant",
            fallback,
            turn["turn_id"],
            source="local_error_fallback",
        )
        turn["assistant_message_id"] = assistant_message["message_id"]
        complete_turn(turn, "failed", turn_started, error)

        return fallback


def terminate_conversation_tool():
    """Closes the current conversation with the user, it should be used when the user wants to close the conversation."""
    global conversation_done
    conversation_done = True


def close_session(status: str = "completed") -> None:
    session["status"] = status
    session["completed_at"] = utc_now()
    update_session_totals()
    append_event("session_closed", status=status)
    save_all()


print(f"Model: {MODEL}")
print(f"Debug folder: {session['debug_path']}")
save_all()

agent_config = load_agent()
agent = create_agent(
    model=MODEL,
    system_prompt=agent_config,
    tools=[terminate_conversation_tool],
)
hello_message = ask_to_agent(
    "Say hello and introduce yourself, expect interaction from the user.",
    "system",
    "greeting",
)
print(hello_message)

while True:
    if conversation_done:
        break
    user_message = input("Ask: ")
    response = ask_to_agent(user_message)
    print(response)

close_session()
print("Conversation closed:")
