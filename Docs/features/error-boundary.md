# Feature Brief: Route Error Boundary

## Goal

Avoid a blank page when a route-level React render error happens, while preserving local-first writing safety.

## Context

The app is a static SPA with lazy product routes, IndexedDB editor autosave, PWA-lite app shell cache, and a local-first cloud outbox. Those layers protect startup, active text, and cloud write intent, but a runtime render error in a route could still blank the current UI.

## Non-Goals

- Error reporting service integration.
- Global process-level crash recovery.
- Replacing local-first autosave or outbox behavior.
- Catching errors from event handlers or async callbacks outside React render/lifecycle.

## In Scope

- Add a route-level `ErrorBoundary`.
- Keep `Nav` and the app shell visible when a product route crashes.
- Provide a readable fallback with actions to return to dashboard or reload.
- Add automated smoke coverage that verifies an editor buffer survives a simulated route crash.

## Out Of Scope

- Sentry or external observability.
- User-facing stack traces in production.
- Automatic data repair.

## Acceptance Criteria

- A route render error shows a human fallback instead of a blank page.
- Navigation remains visible.
- Returning to dashboard clears the crashed route state.
- Existing editor autosave buffer remains recoverable after the error.
- Production builds do not expose the E2E-only simulated crash switch.

## Files Likely Involved

- `src/components/ErrorBoundary.tsx`
- `src/App.tsx`
- `src/styles/base.css`
- `tests/e2e/local-writing-flow.spec.ts`
- `Docs/adr/0012-route-error-boundary.md`

## Tests Required

- Playwright route crash smoke.
- Existing editor autosave recovery E2E.
- `npm run quality`.

## Risks

- Boundary placement can hide navigation if wrapped too high.
- Reset behavior can loop if it returns to the same crashing route.
- Fallback copy can become alarming and hurt trust.

## Verification

- `npm run quality`
- `npm run test:e2e`
- Manual QA: open editor, type text, simulate a route crash, return to dashboard, reopen editor, confirm buffer remains.

## Notes For LLM Agent

- Keep the boundary around route content, not around the full shell.
- Do not remove or weaken `src/lib/editorBuffer.ts`.
- Do not introduce production-only test triggers.
