# Feature Brief

## Goal

Make the first usable screen appear quickly by removing third-party startup blockers and keeping non-current app sections out of the initial route.

## Context

The app is a static GitHub Pages SPA with local-first writing safety. Static-first boot already prevents Supabase hydration from blocking first render, but `index.html` still loaded the Telegram SDK before React and `App` still imported most product screens eagerly.

## Non-Goals

- Do not change Supabase schema, RLS, or RPC behavior.
- Do not change editor autosave semantics.
- Do not add a service worker in this pass.
- Do not split the Supabase client/store yet; that is a larger cloud adapter refactor.

## In Scope

- Dynamically load Telegram Web App SDK only for Telegram launch URLs.
- Keep normal browser launches from requesting Telegram SDK.
- Lazy-load dashboard/editor/bank/season/export/capsule/collection route components.
- Add automated checks for Telegram SDK loading behavior and static shell availability.

## Out Of Scope

- Full Supabase SDK lazy import.
- PWA/offline asset cache.
- Lighthouse CI.

## Acceptance Criteria

- Normal browser startup renders the landing/static shell without requesting `https://telegram.org/js/telegram-web-app.js`.
- Telegram Mini App startup loads the SDK dynamically and still starts `telegram-auth`.
- Non-current route components are split from the initial route bundle.
- Existing local writing, autosave, bank, capsule, export, and TMA E2E flows still pass.

## Files Likely Involved

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/lib/telegramApp.ts`
- `src/components/AuthGate.tsx`
- `tests/e2e/local-writing-flow.spec.ts`
- `Docs/adr/`

## Tests Required

- Unit tests for Telegram launch parameter detection.
- Playwright startup tests for normal browser and Telegram Mini App flows.
- `npm run quality:full`.

## Risks

- Telegram SDK loading can race with `AuthGate`; use a startup state machine and singleton loader.
- Route-level lazy loading can introduce fallback flicker; keep fallbacks neutral and non-blocking.
- Supabase SDK remains in the main graph until the cloud adapter is refactored.

## Verification

- `npm run quality:full`.
- Build output should show route chunks separate from the main index chunk.

## Notes For LLM Agent

- Read `AGENTS.md` first.
- Check `Docs/CODEMAP.md` and `Docs/TRACEABILITY.md`.
- Update docs if behavior or architecture changes.
