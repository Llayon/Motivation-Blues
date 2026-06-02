# Feature Brief: Cloud Hydration Fail-Open

## Goal
Prevent the startup cloud loading screen from blocking access when Supabase Auth or REST requests are slow, unavailable, or stalled.

## Context
- The app is local-first for active writing.
- Supabase provides cloud Auth, Postgres, RLS, and RPC.
- The previous startup flow could keep `isHydrating` true while cloud requests were pending.

## In Scope
- Bound initial cloud hydration with a short timeout.
- Keep local data available when cloud checks fail.
- Run later auth-state and mutation refreshes in background mode.
- Show a retry path from AuthGate.

## Out Of Scope
- Offline cloud-data cache for authenticated users.
- Supabase schema or RPC changes.
- New auth providers.

## Acceptance Criteria
- The startup loader does not stay visible indefinitely when Supabase is unavailable.
- Local mode remains usable after cloud failure.
- Old cloud responses cannot overwrite newer app state.
- Existing editor autosave recovery remains unchanged.

## Files Likely Involved
- `src/App.tsx`
- `src/store/useAppStore.ts`
- `src/components/AuthGate.tsx`
- `src/lib/cloudHydration.ts`
- `tests/e2e/local-writing-flow.spec.ts`

## Tests Required
- Unit test for timeout helper.
- E2E test that aborts cloud requests and expects the start screen/local fallback.
- Existing local writing and autosave E2E tests.

## Risks
- A too-short timeout could send users to local mode during temporary latency.
- Background refreshes must not show fullscreen loader flashes.
- Stale cloud responses must not overwrite newer local/auth state.

## Notes For LLM Agent
- Do not weaken IndexedDB editor autosave.
- Do not add offline cloud-data merging unless explicitly planned.
