# Handoff

Use this file to give the next LLM session a compact starting point. Update it after substantial architecture, workflow, or product changes.

## Current State
- MVP runs as a static React/Vite SPA on GitHub Pages with Supabase Auth/Postgres/RLS/RPC.
- Editor autosave is local-first through IndexedDB with localStorage fallback.
- Supabase boot hydration is bounded by timeout and fails open to local/AuthGate access.
- Banked posts can be edited without duplicating progress or capsules.
- Telegram-style formatting is stored as raw text and safely previewed.
- LLM-first workflow docs now include code map, traceability, boundaries, regression log, copy guide, checklists, and ADR/feature templates.
- CI enforces ADR updates for architecture-sensitive changes through `npm run adr:check`.

## Last Verified
- `npm run docs:changed-check`
- `npm run adr:check`
- `npm run verify:full`
- `npm test`
- `npm run test:e2e`
- `npm run build`
- `npm run verify:pages`

## Known Risks
- Three/R3F is still eagerly bundled and keeps the main JS chunk large.
- Supabase contract/RLS tests are planned but not automated yet.
- Visual QA remains manual; no screenshot regression suite yet.

## Next Best Tasks
1. Lazy-load 3D screens to reduce the initial JS chunk.
2. Add an ErrorBoundary so runtime UI errors do not blank the app.
3. Add Supabase contract tests for RLS and RPC behavior.
4. Add screenshot-based visual QA for landing, dashboard, editor, bank, and capsule screens.
