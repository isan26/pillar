"""Pure helpers for token-count parsing and cost calculation.

extract_usage and calculate_cost take `model` and `pricing` as arguments so
they don't read module-level globals. Easier to test and easier to reuse.
"""

from typing import Any, Mapping, TypedDict

from tracer.config import get_model_pricing
from tracer.sanitize import to_jsonable


class UsageBreakdown(TypedDict):
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None
    estimated_cost_usd: float | None
    raw_usage_metadata: dict[str, Any]
    raw_response_metadata: dict[str, Any]


def to_optional_float(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if not isinstance(value, str) or value.strip() == "":
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


def calculate_cost(
    pricing: Mapping[str, Any],
    model: str,
    input_tokens: int | None,
    output_tokens: int | None,
) -> float | None:
    entry = get_model_pricing(pricing, model)
    if entry is None:
        return None

    input_price = to_optional_float(entry.get("input"))
    output_price = to_optional_float(entry.get("output"))

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


def extract_usage(
    ai_message: object,
    model: str,
    pricing: Mapping[str, Any],
) -> UsageBreakdown:
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
        "estimated_cost_usd": calculate_cost(pricing, model, input_tokens, output_tokens),
        "raw_usage_metadata": usage_metadata,
        "raw_response_metadata": response_metadata,
    }
