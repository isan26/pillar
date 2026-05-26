# Agent Instructions

## Quality Bar

This project should be maintained with production-grade discipline: code should be readable, scalable, testable, and safe to evolve as the agent framework grows.

- Read the surrounding code before editing.
- Keep changes scoped, but do not take shortcuts that leave broken typing, broken runtime behavior, or confusing structure.
- Prefer clear, maintainable Python over clever one-off patches.
- Preserve user and collaborator work. Do not revert unrelated changes.
- Do not claim something is verified unless it was actually verified.
- If a check cannot be run, say exactly why and what risk remains.

## Required Verification

Before handing back Python code changes, run the project checks, not just a syntax check.

Run Pyright using the repo config:

```bash
./.venv/Scripts/pyright.exe
```

Compile every Python source file in the repo, excluding generated/cache/venv folders:

```bash
git ls-files "*.py" | xargs python -m py_compile
```

Also inspect the final diff:

```bash
git diff --check
git diff --stat
```

If the shell environment cannot run the Unix-style `git ls-files ... | xargs ...` command, use the platform-native equivalent that compiles all tracked Python files. Do not fall back to checking only the files you remember editing.

## Static Analysis Expectations

- Treat Pyright/Pylance errors as real issues to resolve.
- Do not rely on `py_compile` alone; it only catches syntax errors.
- If a library has overly narrow or inaccurate types, use a narrow, explicit `cast(...)` at the boundary and explain why.
- Avoid broad `Any` unless it is at an external-library boundary or serialization boundary.

## Runtime Safety

- Do not run commands that spend API credits unless the user explicitly approves.
- For LLM/API code, prefer non-API checks first: type checks, syntax checks, import checks, and isolated helper tests.
- Never log secrets such as API keys, auth headers, cookies, tokens, passwords, or `.env` contents.

## Collaboration

- If reviewing code, findings come first, ordered by severity, with file/line references.
- If implementing a documented plan, keep the implementation aligned with the plan or explicitly call out any deviation.
- When adding tooling, make it repeatable for collaborators through committed config or requirements files.
