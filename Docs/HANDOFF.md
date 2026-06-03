# Handoff

Use this file to give the next LLM session a compact starting point. Update it after substantial architecture, workflow, or product changes.

## Current State

- MVP runs as a static React/Vite SPA on GitHub Pages with Supabase Auth/Postgres/RLS/RPC.
- Editor autosave is local-first through IndexedDB with localStorage fallback.
- Boot is static-first: local/AuthGate UI renders immediately and Supabase hydration runs in the background.
- Telegram SDK is dynamically loaded only for Telegram launch URLs; normal browser startup should not request it.
- Product route screens lazy-load from `App`; auth/start shell stays light.
- Banked posts can be edited without duplicating progress or capsules.
- Telegram-style formatting is stored as raw text and safely previewed.
- Capsule and collection screens lazy-load the 3D/R3F chunk; initial dashboard/editor bundle stays below 500 kB.
- LLM-first workflow docs now include code map, traceability, boundaries, regression log, copy guide, checklists, and ADR/feature templates.
- CI enforces ADR updates for architecture-sensitive changes through `npm run adr:check`.
- Code quality automation now includes Prettier, ESLint, architecture boundary checks, advisory size budgets, clean Knip reporting, and aggregate quality scripts.
- Store/editor/style oversized files have been split into smaller modules and `npm run size:check` is clean.

## Last Verified

- 2026-06-02: `npm audit`
- 2026-06-02: `npm run quality:full` (`format:check`, `lint`, `architecture:check`, `size:check`, `adr:check`, docs check, unit tests, build, Playwright E2E, Pages build, Knip)

## Known Risks

- The lazy 3D chunk remains large by design; do not import R3F from always-loaded views.
- Supabase contract/RLS tests are planned but not automated yet.
- Visual QA remains manual; no screenshot regression suite yet.

## Next Best Tasks

1. Add an ErrorBoundary so runtime UI errors do not blank the app.
2. Add Supabase contract tests for RLS and RPC behavior.
3. Add screenshot-based visual QA for landing, dashboard, editor, bank, and capsule screens.
4. Improve capsule/collection visuals while preserving lazy 3D loading.
