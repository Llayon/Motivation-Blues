# ADR 0014: Manual Diagnostics Hub

## Status

Accepted.

## Decision

Motivation Blues exposes a hidden manual diagnostics screen through the `?debug=1` query parameter.

The screen is rendered by `src/components/DiagnosticsHub.tsx` after Zustand persistence hydrates and before the auth gate blocks unauthenticated users. This lets users collect diagnostics for startup, Telegram, Supabase, service-worker, outbox, and route-recovery issues even when cloud login fails.

The snapshot is built by `src/lib/diagnostics.ts` and includes:

- app version, build SHA, Vite mode, and base URL;
- active view and debug route marker;
- local/cloud mode, cloud configuration, cloud error summary, hydration state, Telegram launch flag, and profile-present boolean;
- counts for posts, drafts, banked posts, archived posts, sealed capsules, and inventory items;
- outbox counters and latest outbox error summary;
- sanitized URL path/query-key summary, online state, user agent, language, and viewport;
- service-worker support, registration, controller, and lifecycle states;
- latest crash report id/message summary when present.

The snapshot intentionally excludes user email, post content, draft content, bank content, editor buffer content, query/hash values, Supabase tokens, and service-role credentials.

## Context

Crash reports help only after a React route crash. The project also has recurring operational risks around Telegram Mini App startup, Supabase latency, PWA cache state, and local-first outbox replay. A manual support screen gives a repeatable debugging artifact without adding remote telemetry or requiring developer tools.

## Consequences

- Users can copy a technical support snapshot before a crash occurs.
- The screen works when no authenticated profile exists.
- Support snapshots remain local and user-controlled.
- The hidden route must not become a general product navigation item without a product decision.
- Service-worker status can be unavailable in some browsers and must degrade safely.

## Verification

- Unit tests cover privacy-safe snapshot generation and service-worker fallback.
- Playwright verifies `?debug=1`, sanitized preview, clipboard copy, and return flow.
- `npm run quality`.
- `npm run test:e2e`.
- `npm run verify:pages`.
