"""File-backed implementation of the ConversationTracer protocol.

Owns all per-session state (session metadata, messages, turns, runs, counters,
perf-timer book-keeping). Writes a folder of JSON/JSONL files matching the
shape consumed by `tools/v1-conversation-tracer/`.
"""

from pathlib import Path
from time import perf_counter
from typing import Any
import uuid

from tracer.base import (
    Message,
    Role,
    Run,
    Session,
    SessionStatus,
    Turn,
)
from tracer.config import load_model_pricing
from tracer.storage import (
    append_jsonl,
    ensure_session_folder,
    utc_now,
    write_conversation_markdown,
    write_json,
)
from tracer.usage import extract_usage


class FileConversationTracer:
    """Stateful per-session recorder that writes to `debug/conversations/<id>/`.

    Construct via `FileConversationTracer.start(model=...)` so the session
    metadata and folder are initialised together.
    """

    def __init__(self, session: Session, folder: Path) -> None:
        self._session: Session = session
        self._folder: Path = folder
        self._messages: list[Message] = []
        self._turns: list[Turn] = []
        self._runs: list[Run] = []
        self._turn_counter: int = 0
        self._run_counter: int = 0
        self._turn_perf_starts: dict[str, float] = {}
        self._run_perf_starts: dict[str, float] = {}
        self._pricing = load_model_pricing()

    @classmethod
    def start(cls, model: str, agent: str | None = None) -> "FileConversationTracer":
        session_id = uuid.uuid4().hex[:8]
        folder, _timestamp = ensure_session_folder(session_id)
        session: Session = {
            "session_id": session_id,
            "model": model,
            "agent": agent,
            "debug_path": str(folder),
            "started_at": utc_now(),
            "completed_at": None,
            "status": "running",
            "total_input_tokens": None,
            "total_output_tokens": None,
            "total_tokens": None,
            "estimated_cost_usd": None,
        }
        tracer = cls(session, folder)
        tracer._save_all()
        return tracer

    # ------------------------------------------------------------------ #
    # Properties                                                          #
    # ------------------------------------------------------------------ #

    @property
    def session_id(self) -> str:
        return self._session["session_id"]

    @property
    def session_path(self) -> Path:
        return self._folder

    @property
    def model(self) -> str:
        return self._session["model"]

    # ------------------------------------------------------------------ #
    # Turns                                                               #
    # ------------------------------------------------------------------ #

    def start_turn(self, user_message: str) -> Turn:
        turn_id = self._next_turn_id()
        turn: Turn = {
            "session_id": self.session_id,
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
        self._turns.append(turn)
        self._turn_perf_starts[turn_id] = perf_counter()
        self._save_turns()
        self._emit_event("turn_started", turn_id=turn_id)
        return turn

    def complete_turn(self, turn: Turn, assistant_message_id: str | None) -> None:
        self._finish_turn(turn, status="completed", assistant_message_id=assistant_message_id)

    def fail_turn(
        self, turn: Turn, error: Exception, assistant_message_id: str | None
    ) -> None:
        self._finish_turn(
            turn,
            status="failed",
            assistant_message_id=assistant_message_id,
            error=error,
        )

    def _finish_turn(
        self,
        turn: Turn,
        status: str,
        assistant_message_id: str | None,
        error: Exception | None = None,
    ) -> None:
        started = self._turn_perf_starts.pop(turn["turn_id"], perf_counter())
        turn["status"] = "completed" if status == "completed" else "failed"
        turn["completed_at"] = utc_now()
        turn["latency_ms"] = round((perf_counter() - started) * 1000)
        turn["assistant_message_id"] = assistant_message_id

        if error is not None:
            turn["error_type"] = type(error).__name__
            turn["error_message"] = str(error)

        self._save_turns()
        self._emit_event(f"turn_{status}", turn_id=turn["turn_id"])

    # ------------------------------------------------------------------ #
    # Runs                                                                #
    # ------------------------------------------------------------------ #

    def start_run(self, turn_id: str | None, purpose: str) -> Run:
        run_id = self._next_run_id()
        model = self._session["model"]
        provider = model.split(":", 1)[0] if ":" in model else None
        run: Run = {
            "session_id": self.session_id,
            "run_id": run_id,
            "turn_id": turn_id,
            "provider": provider,
            "model": model,
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
        self._runs.append(run)
        self._run_perf_starts[run_id] = perf_counter()
        self._save_runs()
        self._emit_event(
            "llm_run_started", run_id=run_id, turn_id=turn_id, purpose=purpose
        )
        return run

    def complete_run(self, run: Run, ai_message: object) -> None:
        started = self._run_perf_starts.pop(run["run_id"], perf_counter())
        usage = extract_usage(ai_message, run["model"], self._pricing)

        run["status"] = "success"
        run["completed_at"] = utc_now()
        run["latency_ms"] = round((perf_counter() - started) * 1000)
        run["input_tokens"] = usage["input_tokens"]
        run["output_tokens"] = usage["output_tokens"]
        run["total_tokens"] = usage["total_tokens"]
        run["estimated_cost_usd"] = usage["estimated_cost_usd"]
        run["raw_usage_metadata"] = usage["raw_usage_metadata"]
        run["raw_response_metadata"] = usage["raw_response_metadata"]

        self._update_totals()
        self._save_runs()
        self._save_session()
        self._emit_event("llm_run_completed", run_id=run["run_id"], turn_id=run["turn_id"])

    def fail_run(self, run: Run, error: Exception) -> None:
        started = self._run_perf_starts.pop(run["run_id"], perf_counter())
        run["status"] = "error"
        run["completed_at"] = utc_now()
        run["latency_ms"] = round((perf_counter() - started) * 1000)
        run["error_type"] = type(error).__name__
        run["error_message"] = str(error)

        self._save_runs()
        self._emit_event("llm_run_failed", run_id=run["run_id"], turn_id=run["turn_id"])

    # ------------------------------------------------------------------ #
    # Messages                                                            #
    # ------------------------------------------------------------------ #

    def add_message(
        self, role: Role, content: str, turn_id: str | None, source: str = "user"
    ) -> Message:
        message: Message = {
            "session_id": self.session_id,
            "message_id": f"msg_{len(self._messages) + 1:03d}",
            "turn_id": turn_id,
            "role": role,
            "content": content,
            "source": source,
            "created_at": utc_now(),
        }
        self._messages.append(message)
        self._save_messages()
        self._save_conversation_markdown()
        self._emit_event(
            f"{role}_message_saved", message_id=message["message_id"], turn_id=turn_id
        )
        return message

    def langchain_messages(self) -> list[dict[str, str]]:
        return [{"role": message["role"], "content": message["content"]} for message in self._messages]

    # ------------------------------------------------------------------ #
    # Session lifecycle                                                   #
    # ------------------------------------------------------------------ #

    def close(self, status: SessionStatus = "completed") -> None:
        self._session["status"] = status
        self._session["completed_at"] = utc_now()
        self._update_totals()
        self._emit_event("session_closed", status=status)
        self._save_all()

    # ------------------------------------------------------------------ #
    # Internals                                                           #
    # ------------------------------------------------------------------ #

    def _next_turn_id(self) -> str:
        self._turn_counter += 1
        return f"turn_{self._turn_counter:03d}"

    def _next_run_id(self) -> str:
        self._run_counter += 1
        return f"run_{self._run_counter:03d}"

    def _emit_event(self, event_type: str, **metadata: Any) -> None:
        event: dict[str, Any] = {
            "session_id": self.session_id,
            "event_type": event_type,
            "timestamp": utc_now(),
            **metadata,
        }
        append_jsonl(self._folder, "events.jsonl", event)

    def _update_totals(self) -> None:
        input_total = 0
        output_total = 0
        token_total = 0
        cost_total = 0.0
        has_input = False
        has_output = False
        has_tokens = False
        has_cost = False

        for run in self._runs:
            if run["input_tokens"] is not None:
                input_total += run["input_tokens"]
                has_input = True
            if run["output_tokens"] is not None:
                output_total += run["output_tokens"]
                has_output = True
            if run["total_tokens"] is not None:
                token_total += run["total_tokens"]
                has_tokens = True
            if run["estimated_cost_usd"] is not None:
                cost_total += run["estimated_cost_usd"]
                has_cost = True

        self._session["total_input_tokens"] = input_total if has_input else None
        self._session["total_output_tokens"] = output_total if has_output else None
        self._session["total_tokens"] = token_total if has_tokens else None
        self._session["estimated_cost_usd"] = round(cost_total, 8) if has_cost else None

    def _save_session(self) -> None:
        write_json(self._folder, "session.json", self._session)

    def _save_messages(self) -> None:
        write_json(self._folder, "messages.json", self._messages)

    def _save_turns(self) -> None:
        write_json(self._folder, "turns.json", self._turns)

    def _save_runs(self) -> None:
        write_json(self._folder, "runs.json", self._runs)

    def _save_conversation_markdown(self) -> None:
        write_conversation_markdown(self._folder, self._session, self._messages)

    def _save_all(self) -> None:
        self._save_session()
        self._save_messages()
        self._save_turns()
        self._save_runs()
        self._save_conversation_markdown()
