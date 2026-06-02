# Architecture Boundaries

These rules keep LLM-generated changes from crossing layers accidentally.

`npm run architecture:check` enforces the core import boundaries below. It is intentionally simple and should be updated when the architecture changes.

## State And Data

- UI components read and call actions from `src/store/useAppStore.ts`; they should not write directly to Supabase.
- Cloud persistence lives in `src/store/useAppStore.ts` and `src/services/supabase.ts`.
- Pure calculations belong in `src/lib/` and should have unit tests when practical.
- Shared product shapes belong in `src/types.ts`.

## Editor Safety

- Active writing state must stay local-first.
- IndexedDB editor buffer access goes through `src/lib/editorBuffer.ts`.
- Editor changes must preserve recovery after reload, crash, offline mode, and failed Supabase requests.
- Clearing the editor buffer must remain explicit and ordered after successful save/new-editor actions.

## Supabase

- No service-role keys in frontend code, docs, GitHub Actions frontend env, or tests.
- Applied migrations must not be edited. Add a new timestamped migration instead.
- RPC behavior belongs in migrations and must match `Docs/DATA_CONTRACTS.md`.
- RLS must keep user-owned rows private.

## Product Scope

- No AI text generation or AI review unless the product spec explicitly changes.
- No currency, tickets, shop, or monetized gacha.
- No Telegram publishing integration in MVP.
- Telegram-style markup is formatting syntax only, not platform integration.

## UI And Copy

- Preserve the calm, premium, lightly ironic literary-club tone.
- Reward animations and capsule opening must not interrupt typing.
- Three/R3F imports should stay behind lazy reward screens and must not move into always-loaded dashboard/editor routes.
- Red or punitive progress copy should appear only for real missed previous days.
- Follow `Docs/COPY_GUIDE.md` for copy changes.

## Deployment

- Keep GitHub Pages subpath support: `VITE_BASE_PATH=/Motivation-Blues/`.
- Magic-link redirects must remain compatible with `https://llayon.github.io/Motivation-Blues/`.
- Deploy-affecting changes should run `npm run verify:pages`.

## Quality Gates

- Prettier controls formatting through `npm run format:check`.
- ESLint controls static code quality through `npm run lint`.
- Size budgets are advisory through `npm run size:check`, but the current source tree should stay warning-free unless a follow-up task documents the exception.
- Knip runs in report-only mode through `npm run deadcode`, and new findings should be removed or documented intentionally.
