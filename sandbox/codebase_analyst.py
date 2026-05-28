"""Sandbox: feed the whole codebase to an agent and watch the token numbers.

Run from the repo root as a module so the root-level `agent`/`tracer` imports
resolve:

    python -m sandbox.codebase_analyst
    python -m sandbox.codebase_analyst --all-files     # escalate toward a choke
    python -m sandbox.codebase_analyst --yes            # skip confirmation prompts

The codebase is loaded once as a hidden system message; then it's an interactive
Q&A loop. Before every model call you see a local token estimate and cost
preview, and (by default) confirm the send.
"""

from argparse import ArgumentParser, Namespace
from typing import Any, Mapping
import os

from dotenv import load_dotenv
from langchain.agents import create_agent

from agent import DEFAULT_MODEL, ask, enable_utf8_stdout, resolve_agent_prompt
from tracer import FileConversationTracer
from tracer.config import get_model_pricing, load_model_pricing

from sandbox.codebase import (
    build_codebase_context,
    collect_source_files,
    count_tokens,
    get_encoding,
)


DEFAULT_AGENT = "codebase-analyst-v1"
DEFAULT_MAX_INPUT_TOKENS = 200_000
DEFAULT_COST_CONFIRM_THRESHOLD = 0.01
TOP_FILES_SHOWN = 5


def parse_cli() -> Namespace:
    parser = ArgumentParser(description="Feed the codebase to an agent and watch token usage.")
    parser.add_argument("--agent", default=DEFAULT_AGENT, help="Agent name to load.")
    parser.add_argument("--model", default=None, help="Model id (defaults to env MODEL).")
    parser.add_argument(
        "--all-files",
        action="store_true",
        help="Include lockfiles too (escalates toward a deliberate choke).",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip the per-request confirmation prompt.",
    )
    parser.add_argument(
        "--max-input-tokens",
        type=int,
        default=DEFAULT_MAX_INPUT_TOKENS,
        help="Refuse to send above this local estimate unless --force is set.",
    )
    parser.add_argument(
        "--cost-confirm-threshold",
        type=float,
        default=DEFAULT_COST_CONFIRM_THRESHOLD,
        help="Re-confirm any turn whose estimated cost is at or above this (USD).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Send even if the estimate exceeds --max-input-tokens.",
    )
    return parser.parse_args()


def format_cost(value: float | None) -> str:
    return "unknown" if value is None else f"${value:.4f}"


def estimate_input_cost(
    pricing: Mapping[str, Any],
    model: str,
    est_tokens: int,
) -> tuple[float | None, float | None]:
    """Return (estimated_input_cost_usd, output_price_per_1m) for the preview."""
    entry = get_model_pricing(pricing, model)
    if entry is None:
        return None, None

    input_price = entry.get("input")
    output_price = entry.get("output")
    input_cost = (
        est_tokens / 1_000_000 * input_price
        if isinstance(input_price, (int, float))
        else None
    )
    out_price = output_price if isinstance(output_price, (int, float)) else None
    return input_cost, out_price


def confirm(prompt: str) -> bool:
    answer = input(prompt).strip().lower()
    return answer in ("y", "yes")


def main() -> None:
    enable_utf8_stdout()
    load_dotenv()
    args = parse_cli()
    model = args.model or os.getenv("MODEL", DEFAULT_MODEL)

    prompt, prompt_source = resolve_agent_prompt(args.agent)
    encoding = get_encoding(model)
    pricing = load_model_pricing()

    files = collect_source_files(include_all=args.all_files)
    context, per_file = build_codebase_context(files, encoding)
    total_tokens = sum(tokens for _, tokens in per_file)

    tracer = FileConversationTracer.start(model=model, agent=args.agent)

    context_path = tracer.session_path / "codebase_context.md"
    context_path.write_text(_render_context_artifact(context, per_file), encoding="utf-8")

    print(f"Model: {model}")
    print(f"Agent: {args.agent}  ({prompt_source})")
    print(f"Debug folder: {tracer.session_path}")
    print(f"Codebase context saved to: {context_path}")
    print(f"Files included: {len(files)}  (--all-files={args.all_files})")
    print(f"Total local token estimate: {total_tokens:,} (approximate)")
    print(f"Top {TOP_FILES_SHOWN} files by tokens:")
    for path, tokens in per_file[:TOP_FILES_SHOWN]:
        print(f"  {tokens:>8,}  {path.as_posix()}")

    tracer.add_message("system", context, turn_id=None, source="codebase_context")

    conversation_done = {"value": False}

    def terminate_conversation_tool() -> None:
        """Closes the current conversation with the user, it should be used when the user wants to close the conversation."""
        conversation_done["value"] = True

    agent = create_agent(
        model=model,
        system_prompt=prompt,
        tools=[terminate_conversation_tool],
    )

    is_first_send = True

    while not conversation_done["value"]:
        user_message = input("\nAsk: ")
        if not user_message.strip():
            continue

        payload_text = "\n".join(
            message["content"] for message in tracer.langchain_messages()
        )
        payload_text = f"{payload_text}\n{user_message}"
        est_tokens = count_tokens(payload_text, encoding)
        input_cost, out_price = estimate_input_cost(pricing, model, est_tokens)

        print(f"  ~ {est_tokens:,} input tokens (approximate; real tokenizer may differ)")
        if get_model_pricing(pricing, model) is None or input_cost is None:
            print(f"  ~ est. input cost: unknown for {model} (no price set; try gpt-5.4-mini)")
        else:
            out_str = f"${out_price:.2f}/1M" if out_price is not None else "unknown"
            print(
                f"  ~ est. input cost: {format_cost(input_cost)}; "
                f"output billed @ {out_str} (unknown until reply)"
            )

        if est_tokens > args.max_input_tokens and not args.force:
            print(
                f"  ! estimate exceeds --max-input-tokens ({args.max_input_tokens:,}). "
                f"Not sending. Re-run with --force to send anyway."
            )
            continue

        needs_confirm = is_first_send or (
            input_cost is not None and input_cost >= args.cost_confirm_threshold
        )
        if needs_confirm and not args.yes:
            if not confirm("  Proceed with this request? [y/N] "):
                print("  Skipped.")
                continue

        response = ask(agent, tracer, model, user_message)
        print(response)
        _print_usage(tracer)
        is_first_send = False

    tracer.close()
    print("Conversation closed.")


def _print_usage(tracer: FileConversationTracer) -> None:
    run = tracer.last_run
    if run is None:
        return
    if run["status"] == "error":
        print(f"  [run failed: {run['error_type']}]")
        return
    print(
        f"  [tokens] in={_fmt(run['input_tokens'])} "
        f"out={_fmt(run['output_tokens'])} "
        f"total={_fmt(run['total_tokens'])} "
        f"cost={format_cost(run['estimated_cost_usd'])} "
        f"latency={_fmt(run['latency_ms'])}ms"
    )


def _fmt(value: int | None) -> str:
    return "?" if value is None else f"{value:,}"


def _render_context_artifact(
    context: str,
    per_file: list[tuple[Any, int]],
) -> str:
    lines = ["# Codebase context sent to the model", "", "## Per-file token estimate", ""]
    for path, tokens in per_file:
        lines.append(f"- {tokens:>8,}  {path.as_posix()}")
    lines.extend(["", "## Full context", "", context])
    return "\n".join(lines)


if __name__ == "__main__":
    main()
