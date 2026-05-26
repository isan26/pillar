"""Public types and Protocol for the conversation tracer.

Other modules in the package only depend on this file; this file imports nothing
from the package itself, which keeps the dependency direction one-way and
avoids circular imports.
"""

from pathlib import Path
from typing import Any, Literal, Protocol, TypedDict


Role = Literal["system", "user", "assistant"]
SessionStatus = Literal["running", "completed", "failed"]
TurnStatus = Literal["running", "completed", "failed"]
RunStatus = Literal["running", "success", "error"]


class Session(TypedDict):
    session_id: str
    model: str
    agent: str | None
    debug_path: str
    started_at: str
    completed_at: str | None
    status: SessionStatus
    total_input_tokens: int | None
    total_output_tokens: int | None
    total_tokens: int | None
    estimated_cost_usd: float | None


class Message(TypedDict):
    session_id: str
    message_id: str
    turn_id: str | None
    role: Role
    content: str
    source: str
    created_at: str


class Turn(TypedDict):
    session_id: str
    turn_id: str
    status: TurnStatus
    started_at: str
    completed_at: str | None
    latency_ms: int | None
    user_message: str
    assistant_message_id: str | None
    error_type: str | None
    error_message: str | None


class Run(TypedDict):
    session_id: str
    run_id: str
    turn_id: str | None
    provider: str | None
    model: str
    purpose: str
    status: RunStatus
    started_at: str
    completed_at: str | None
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None
    latency_ms: int | None
    estimated_cost_usd: float | None
    raw_usage_metadata: dict[str, Any]
    raw_response_metadata: dict[str, Any]
    error_type: str | None
    error_message: str | None


class DebugEvent(TypedDict, total=False):
    session_id: str
    event_type: str
    timestamp: str
    turn_id: str
    run_id: str
    message_id: str
    purpose: str
    status: str


class ConversationTracer(Protocol):
    """The seam between agent.py and any debug-logging backend.

    A future SQLite/Postgres backend can implement this same interface and
    agent.py will not need to change.
    """

    @property
    def session_id(self) -> str: ...

    @property
    def session_path(self) -> Path: ...

    def start_turn(self, user_message: str) -> Turn: ...

    def complete_turn(self, turn: Turn, assistant_message_id: str | None) -> None: ...

    def fail_turn(
        self, turn: Turn, error: Exception, assistant_message_id: str | None
    ) -> None: ...

    def start_run(self, turn_id: str | None, purpose: str) -> Run: ...

    def complete_run(self, run: Run, ai_message: object) -> None: ...

    def fail_run(self, run: Run, error: Exception) -> None: ...

    def add_message(
        self, role: Role, content: str, turn_id: str | None, source: str = "user"
    ) -> Message: ...

    def langchain_messages(self) -> list[dict[str, str]]: ...

    def close(self, status: SessionStatus = "completed") -> None: ...
