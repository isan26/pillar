# tsa — Agent Instructions

`tsa` is a from-scratch TypeScript agent: LLM primitives (agent loops, tool use etc.)
built directly on provider SDKs, with no framework. This file is the source of
truth for conventions and is kept in sync with `CLAUDE.md`.

## Code Style

### Formatting
- Tabs for indentation, width 4 (`.prettierrc`: `useTabs: true`, `tabWidth: 4`).
- No semicolons (`.prettierrc`: `semi: false`).
- Prefer `function` declarations over `const` arrow functions (arrows are fine for
  inline callbacks and inline-returning helpers).

### TypeScript
- **NEVER use `any`** — use `unknown` when the type is truly unknown, then narrow
  with type guards.
- **Prefer `type` over `interface`.**
- Explicit return types on functions.
- Import types with the `type` keyword: `import type { Message } from "@/conversation/message"`.
- Strict compiler settings (already set in `tsconfig.json`).

### Imports
- **ALWAYS use `@/` alias imports, never relative.**
  - ✅ `import { createAnthropicModel } from "@/provider/anthropic"`
  - ❌ `import { createAnthropicModel } from "../provider/anthropic"`
- The alias (`@/*` → `src/*`) is configured in `tsconfig.json` `paths`. `tsx` resolves
  it automatically; `vitest` needs the `vite-tsconfig-paths` plugin (add when tests land).

### Naming
- **Booleans**: prefix with `is` / `has` / `should` / `can`.
- **Functions**: descriptive verbs — `createAnthropicModel`, `runAgentLoop`.
- **True constants**: UPPER_SNAKE_CASE — `MAX_TOKENS`, `DEFAULT_MODEL`.
- **Files**: kebab-case — `chat-model.ts`, `agent-loop.ts`.
- **Name types by what they are, not how they're implemented** — `ChatModel`, not `ModelClient`.

### Comments
- Comment the non-obvious — *why*, not *what*. Skip comments for self-explanatory code.

## Architecture
- **Provider seam.** Vendor SDKs are quarantined in `@/provider/`. **Only files there
  may import `@anthropic-ai/sdk`** (or any future provider SDK). Everything else depends
  on our own types and the `ChatModel` interface — never on a vendor SDK.
- **Own your types.** Define domain types (`Message`, `Role`, …) ourselves and map vendor
  shapes to/from them at the provider boundary. This is the anti-corruption layer that
  keeps vendor churn contained to one folder.
- **Hand-written loop.** The agent loop is ours and provider-agnostic — no framework.
- **Config vs secrets.** Secrets live in `.env` (`ANTHROPIC_API_KEY`, read automatically
  by the SDK). Non-secret config lives in code as constants under `@/constants/`.

## Tooling
- Use **npm** (not pnpm/yarn).
- Run: `npm run dev` (tsx). Typecheck: `npm run typecheck` (`tsc --noEmit`).
  Test: `npm test` (vitest).

## Git
- Commit messages are concise **one-liners** — no body, and **no `Co-Authored-By` / sign-off trailer**.

## Required Verification
Before handing back changes:
- `npm run typecheck` passes — no type errors.
- `npm run dev` runs without errors.
