# ADR 0011: Local-First Sync Outbox

## Status

Accepted.

## Decision

Motivation Blues uses an app-runtime local-first outbox for cloud write durability.

The outbox stores write operations in IndexedDB database `motivation-blues-sync-outbox`, object store `sync-operations`, with localStorage fallback. Each operation records type, entity id, payload, status, attempts, timestamps, and an idempotency key.

Supported v1 operations:

- `saveDraft`
- `bankPost`
- `updateBankedPost`
- `archivePost`

When a supported cloud write fails, `useAppStore` applies the expected state locally first, enqueues the operation, and exposes a compact sync status in `Nav`. `App` refreshes status after Zustand hydration and retries queued operations on browser `online`. Cloud hydration also starts replay after a successful authenticated snapshot.

`saveCloudPost` uses a stable client-generated `posts.id` and Supabase `upsert` for idempotent replay. `bankPost` replay checks the current cloud post status before calling `bank_post` so an already-banked row is not counted twice.

The outbox is deliberately not implemented in the service worker. The PWA service worker remains static-shell only and must not cache or mutate Supabase/Auth/Telegram/private data.

## Context

PWA-lite made the app shell installable and cacheable, while IndexedDB editor autosave protected active text. However, explicit cloud-mode actions still depended on immediate Supabase availability. Slow or unavailable Supabase could make a saved draft/banked post feel lost even though the local editor buffer was safe.

Alternatives considered:

- Immediate failure only: simpler, but leaves users with repeated manual retry and weak confidence.
- Service worker Background Sync: better eventual delivery, but adds browser support variance, harder auth handling, and higher private-data risk.
- Full CRDT/merge sync: too heavy for MVP because the product currently has single-author private drafts/posts.

## Consequences

- Cloud-mode draft/bank/update/archive actions can fail open and remain locally visible.
- Users get a visible retry/status path without blocking writing.
- The existing editor buffer remains separate and continues to protect keystrokes.
- Offline cloud write sync is now partially supported, but capsule opening and cross-device conflicts still need explicit future designs.
- Local optimistic progress can temporarily differ from Supabase until replay completes.
- Multi-tab replay can duplicate attempts in rare cases; idempotent post ids and `bank_post` status checks reduce the dangerous cases.

## Verification

- Unit tests cover outbox fallback queueing and state transitions in `src/lib/syncOutbox.test.ts`.
- `npm test`.
- `npm run build`.
- `npm run quality`.
- Manual QA should block Supabase REST/Auth, save draft/bank in cloud mode, verify the nav sync pill, restore network, retry, and confirm cloud hydration clears pending state.
