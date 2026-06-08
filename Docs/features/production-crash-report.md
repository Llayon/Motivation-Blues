# Feature Brief

## Goal

Let a production user recover from a route crash and copy a local diagnostic report without sending data to any external service automatically.

## Context

Route-level `ErrorBoundary` already keeps the shell visible after active-view render/lifecycle crashes. The missing piece was an actionable crash report so debugging production/TMA failures does not depend on screenshots or guesswork.

## Non-Goals

- No remote telemetry.
- No Supabase writes.
- No user text, email, or post-bank content in the report.
- No service-worker or background-sync diagnostics.

## In Scope

- Create a typed crash report in `src/lib/crashReport.ts`.
- Save the latest report to localStorage under `motivation-blues-crash-report`.
- Include route, app build metadata, runtime metadata, sync/cloud mode, error stack, and React component stack.
- Add a copy button to the `ErrorBoundary` fallback.
- Add unit and E2E coverage.

## Out Of Scope

- Sentry or other hosted observability.
- A standalone diagnostics route.
- Automatic upload after the user reconnects.

## Acceptance Criteria

- A route crash stores a local report even in production builds.
- The fallback screen offers `Скопировать отчет`.
- Copying does not expose editor content or user email.
- If storage or clipboard is unavailable, the recovery fallback still works.
- Navigation and editor autosave recovery remain intact.

## Files Likely Involved

- `src/lib/crashReport.ts`
- `src/components/ErrorBoundary.tsx`
- `src/App.tsx`
- `src/styles/base.css`
- `vite.config.ts`
- `tests/e2e/local-writing-flow.spec.ts`

## Tests Required

- Unit tests for creating, saving, reading, formatting, and copying reports.
- E2E route crash smoke verifying local report storage and clipboard copy.

## Risks

- Accidentally storing private writing content.
- Clipboard permissions can vary by browser.
- Reports can become stale if the latest report is not overwritten on each crash.

## Verification

- `npm run quality`
- `npm run test:e2e`
- `npm run verify:pages`

## Notes For LLM Agent

- Keep diagnostics local-only unless a new ADR explicitly accepts remote telemetry.
- Do not add Supabase service-role keys or private user data to reports.
