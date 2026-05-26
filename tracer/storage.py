"""Filesystem I/O primitives and the conversation.md renderer.

All functions here are stateless: they take the session folder and a payload
and write it. Anything that mutates session/turn/run state lives on the
tracer class.
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
import json

from tracer.base import Message, Session
from tracer.config import DEBUG_DIR, TEXT_ENCODING
from tracer.sanitize import to_jsonable


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure_session_folder(session_id: str) -> tuple[Path, str]:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    folder = DEBUG_DIR / "conversations" / f"{timestamp}-{session_id}"
    folder.mkdir(parents=True, exist_ok=True)
    return folder, timestamp


def write_json(folder: Path, name: str, payload: Any) -> None:
    with open(folder / name, "w", encoding=TEXT_ENCODING) as file:
        json.dump(to_jsonable(payload), file, ensure_ascii=False, indent=2)
        file.write("\n")


def append_jsonl(folder: Path, name: str, payload: Any) -> None:
    with open(folder / name, "a", encoding=TEXT_ENCODING) as file:
        file.write(json.dumps(to_jsonable(payload), ensure_ascii=False) + "\n")


def render_conversation_markdown(session: Session, messages: Iterable[Message]) -> str:
    lines = [
        "# Conversation",
        "",
        f"Session: {session['session_id']}",
        f"Model: {session['model']}",
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

    return "\n".join(lines)


def write_conversation_markdown(
    folder: Path, session: Session, messages: Iterable[Message]
) -> None:
    body = render_conversation_markdown(session, messages)
    with open(folder / "conversation.md", "w", encoding=TEXT_ENCODING) as file:
        file.write(body)
