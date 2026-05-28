"""Pure helpers for the codebase-analyst sandbox: gather source files, count
tokens locally, and build a single context blob.

No API calls happen here, so this module is safe (and free) to import and test
on its own.
"""

from pathlib import Path
import subprocess

import tiktoken


# Files that are tracked but not worth feeding to the model: binaries, images,
# fonts, and git pack data. Matched by suffix (lowercased).
BINARY_SUFFIXES: frozenset[str] = frozenset(
    {
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
        ".pack", ".idx", ".woff", ".woff2", ".ttf", ".eot",
        ".pdf", ".zip", ".gz", ".pyc",
    }
)

# Large generated files that bloat the context without teaching much. Skipped
# unless include_all=True. Matched by file name.
LOCKFILE_NAMES: frozenset[str] = frozenset(
    {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "uv.lock"}
)


def collect_source_files(include_all: bool = False) -> list[Path]:
    """Return git-tracked text files, sorted.

    Uses `git ls-files`, so .gitignore is respected and only tracked files are
    returned. Binaries/images are always skipped; lockfiles are skipped unless
    include_all is True.
    """
    output = subprocess.run(
        ["git", "ls-files"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    files: list[Path] = []
    for line in output.splitlines():
        name = line.strip()
        if not name:
            continue
        path = Path(name)
        if path.suffix.lower() in BINARY_SUFFIXES:
            continue
        if not include_all and path.name in LOCKFILE_NAMES:
            continue
        files.append(path)

    return sorted(files)


def read_file_safe(path: Path) -> str:
    """Read a file as UTF-8, replacing undecodable bytes instead of raising."""
    return path.read_text(encoding="utf-8", errors="replace")


def get_encoding(model: str) -> tiktoken.Encoding:
    """Best-effort tokenizer for the model.

    The model id may carry a framework prefix like "openai:gpt-5-mini"; strip it
    before asking tiktoken. tiktoken may not know newer gpt-5 ids, so fall back
    to o200k_base (the GPT-4o/5-family base). Counts are therefore an ESTIMATE:
    the provider's real tokenizer can differ slightly.
    """
    bare = model.split(":", 1)[1] if ":" in model else model
    try:
        return tiktoken.encoding_for_model(bare)
    except KeyError:
        return tiktoken.get_encoding("o200k_base")


def count_tokens(text: str, encoding: tiktoken.Encoding) -> int:
    return len(encoding.encode(text, disallowed_special=()))


def build_codebase_context(
    files: list[Path],
    encoding: tiktoken.Encoding,
) -> tuple[str, list[tuple[Path, int]]]:
    """Concatenate files into one context string with `// path` headers.

    Returns the context string plus a per-file (path, token_count) list (sorted
    largest-first) for the startup breakdown.
    """
    blocks: list[str] = []
    per_file: list[tuple[Path, int]] = []

    for path in files:
        content = read_file_safe(path)
        block = f"// {path.as_posix()}\n{content}"
        blocks.append(block)
        per_file.append((path, count_tokens(block, encoding)))

    context = "\n\n".join(blocks)
    per_file.sort(key=lambda item: item[1], reverse=True)
    return context, per_file
