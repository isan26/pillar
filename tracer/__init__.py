"""Conversation tracer package.

Public surface:
  - ConversationTracer: the Protocol agent.py depends on.
  - FileConversationTracer: the file-backed implementation used today.
  - The TypedDicts that describe records on disk.
"""

from tracer.base import (
    ConversationTracer,
    DebugEvent,
    Message,
    Role,
    Run,
    RunStatus,
    Session,
    SessionStatus,
    Turn,
    TurnStatus,
)
from tracer.file_tracer import FileConversationTracer


__all__ = [
    "ConversationTracer",
    "DebugEvent",
    "FileConversationTracer",
    "Message",
    "Role",
    "Run",
    "RunStatus",
    "Session",
    "SessionStatus",
    "Turn",
    "TurnStatus",
]
