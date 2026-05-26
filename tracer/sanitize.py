"""Redact secret-looking keys and coerce values into JSON-serializable shapes.

Pure functions, no I/O, no state. Lifted from agent.py without behavior change
so existing debug-folder content stays byte-identical.
"""

from pathlib import Path
from typing import Any

from tracer.config import SENSITIVE_KEY_PARTS


def is_sensitive_key(key: str) -> bool:
    key_lower = key.lower()
    if any(part in key_lower for part in SENSITIVE_KEY_PARTS):
        return True

    return key_lower == "token" or key_lower.endswith("_token") or key_lower.endswith("-token")


def sanitize_for_logging(value: Any) -> Any:
    if isinstance(value, dict):
        cleaned: dict[Any, Any] = {}
        for key, item in value.items():  # pyright: ignore[reportUnknownVariableType]
            key_string = str(key)
            if is_sensitive_key(key_string):
                cleaned[key] = "[REDACTED]"
            else:
                cleaned[key] = sanitize_for_logging(item)
        return cleaned

    if isinstance(value, list):
        return [sanitize_for_logging(item) for item in value]  # pyright: ignore[reportUnknownVariableType]

    return value


def to_jsonable(value: Any) -> Any:
    value = sanitize_for_logging(value)

    if isinstance(value, (str, int, float, bool)) or value is None:
        return value

    if isinstance(value, Path):
        return str(value)

    if isinstance(value, dict):
        return {str(key): to_jsonable(item) for key, item in value.items()}  # pyright: ignore[reportUnknownVariableType]

    if isinstance(value, (list, tuple)):
        return [to_jsonable(item) for item in value]  # pyright: ignore[reportUnknownVariableType]

    if hasattr(value, "model_dump"):
        return to_jsonable(value.model_dump())

    return str(value)
