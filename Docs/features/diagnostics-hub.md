# Feature Brief

## Goal

Give a user or tester a manual support screen that can copy a safe technical snapshot when Telegram, Supabase, PWA, outbox, or route recovery behavior needs debugging.

## Context

Crash reports are available only after a route crash. Startup and cloud issues often need a snapshot before any crash happens, especially inside Telegram Mini Apps or when Supabase is slow.

## Non-Goals

- No remote telemetry.
- No Supabase writes.
- No user email, post text, editor buffer, bank content, auth tokens, or query/hash values.
- No service-worker cache mutation.

## In Scope

- Add a hidden `?debug=1` support route.
- Show app build metadata, active view, local/cloud mode, Telegram detection, online state, Supabase/cloud state, outbox counters, service worker status, and latest crash report summary.
- Add copy, cloud retry, outbox retry, crash-report cleanup, and return actions.
- Add unit and E2E coverage for sanitized snapshots.

## Out Of Scope

- Public navigation item.
- Hosted observability.
- Log upload after reconnect.
- Full IndexedDB inspection.

## Acceptance Criteria

- `/?debug=1` opens the diagnostics screen after Zustand persistence hydrates.
- The screen is reachable before auth/profile exists.
- `Скопировать диагностику` copies a JSON snapshot.
- URL query/hash values are not copied.
- User email and writing content are not copied.
- `Вернуться` removes `debug` from the URL and returns to the normal app flow.

## Files Likely Involved

- `src/lib/diagnostics.ts`
- `src/components/DiagnosticsHub.tsx`
- `src/App.tsx`
- `src/styles/base.css`
- `src/styles/responsive.css`
- `tests/e2e/local-writing-flow.spec.ts`

## Tests Required

- Unit tests for diagnostics snapshot creation and service-worker fallback.
- E2E test for `?debug=1`, sanitized preview, clipboard copy, and return flow.

## Risks

- Accidentally exposing user content or auth tokens.
- Making the hidden support screen look like a product route.
- Relying on service-worker APIs that may not exist in all browsers.

## Verification

- `npm run quality`
- `npm run test:e2e`
- `npm run verify:pages`

## Notes For LLM Agent

- Keep this route hidden and user-controlled.
- Do not add a nav item without a product decision.
- Treat diagnostics as local-only unless a future ADR accepts remote telemetry.
