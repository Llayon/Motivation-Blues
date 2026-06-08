# ADR 0012: Route Error Boundary

## Status

Accepted.

## Decision

Motivation Blues wraps lazy product route rendering in a route-level React `ErrorBoundary`.

The boundary is placed inside `App` around `Suspense` and `ActiveView`, while `Nav`, the app shell, aurora background, and `ClassicToast` remain outside the boundary. If a route crashes during render/lifecycle, the user sees a calm fallback instead of a blank page.

Fallback actions:

- return to dashboard and reset the boundary;
- reload the app.

The boundary does not own editor autosave, local persistence, cloud hydration, or outbox replay. Those safety layers remain independent.

## Context

The app already protects startup and writing durability with static-first boot, IndexedDB editor autosave, PWA-lite shell caching, and a local-first cloud outbox. However, a React render error in a lazy-loaded route could still unmount the UI tree and leave the user with a blank page.

Wrapping the full app shell would hide navigation and reduce recovery options. Wrapping each route separately would add repetition. A single route-level boundary around `ActiveView` gives the user a stable shell and keeps the implementation small.

## Consequences

- Runtime route render failures show a user-readable fallback.
- Navigation remains available after a route crash.
- Editor autosave and outbox durability are not weakened.
- Errors from event handlers, async callbacks, service worker code, or network failures still need their own handling.
- Future observability can hook into `componentDidCatch` without changing route structure.

## Verification

- Playwright route crash smoke verifies the fallback appears and an IndexedDB editor buffer survives.
- Existing autosave and local writing flow tests continue to pass.
- `npm run quality`.
- `npm run test:e2e`.
