# v1-conversation-tracer — Agent Instructions

Local Vite/React/TS dashboard for inspecting conversation debug artifacts written by `agent.py` to `../../debug/conversations/`.

Read-only viewer — never writes back to the debug folder.

## Code Style

### Formatting
- Use **4-space tabs** for indentation.
- Prefer `function` declarations over `const` arrow functions (unless returning values inline or for callbacks).

### TypeScript
- **NEVER use `any`** — use `unknown` when the type is truly unknown, then narrow it with type guards.
  - ✅ `const data: unknown = JSON.parse(str); if (typeof data === "object") { ... }`
  - ❌ `const data: any = JSON.parse(str);`
- **Always use `type` over `interface`** for type definitions.
- Prefer explicit return types on functions.
- Use strict TypeScript settings.
- Import types with the `type` keyword: `import type { Session } from "@/types"`.

### Imports
- **ALWAYS use `@/` alias imports**, never relative.
  - ✅ `import { SessionList } from "@/views/session-list"`
  - ❌ `import { SessionList } from "../../views/session-list"`
- The alias is configured in `tsconfig.json` (`paths`) and `vite.config.ts` (`resolve.alias`).

### Naming Conventions
- **Booleans**: prefix with `is`, `has`, `should`, `can`.
  - ✅ `isActive`, `hasPermission`, `shouldValidate`
- **Functions**: descriptive verbs.
  - ✅ `getUserById`, `validateEmail`, `formatDate`
- **Constants**: UPPER_SNAKE_CASE for true constants.
  - ✅ `MAX_RETRIES`, `API_BASE_URL`
- **Files**: kebab-case for everything.
  - ✅ `session-list.tsx`, `use-sessions.ts`

### Comments
- Only comment the non-obvious — why, not what.
- Document complex algorithms, business logic, or workarounds.
- Skip comments for self-explanatory code.

## Project Conventions
- All data fetching goes through TanStack Query hooks in `@/hooks/`.
- Filesystem access lives in the Vite middleware in `vite.config.ts` — never from React code.
- Tailwind v4 with `@tailwindcss/vite`; no `tailwind.config.js`. Customise via `@theme` directives in CSS.
- Router routes live in `@/router.tsx`; views in `@/views/`.

## Required Verification
Before handing back changes:
- `npm run build` must succeed (this runs `tsc -b && vite build` — catches type errors).
- Dev server must boot without errors: `npm run dev`.
