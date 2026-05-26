"""Process-wide constants and the model-pricing lookup.

Kept separate from the stateful tracer so other code (and tests) can import
configuration without instantiating anything.
"""

from pathlib import Path
from typing import Any, Mapping
import json
import os


TEXT_ENCODING = "utf-8"

DEBUG_DIR = Path(os.getenv("DEBUG_DIR", "debug"))

MODEL_PRICING_FILE = Path("model-pricing-per-1m-tokens.json")

SENSITIVE_KEY_PARTS: tuple[str, ...] = (
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


def load_model_pricing() -> Mapping[str, Any]:
    if not MODEL_PRICING_FILE.exists():
        return {}

    with open(MODEL_PRICING_FILE, "r", encoding=TEXT_ENCODING) as file:
        data = json.load(file)

    if not isinstance(data, dict):
        return {}

    return data


def get_model_pricing(pricing: Mapping[str, Any], model: str) -> Mapping[str, Any] | None:
    entry = pricing.get(model)
    if not isinstance(entry, dict):
        return None
    return entry
