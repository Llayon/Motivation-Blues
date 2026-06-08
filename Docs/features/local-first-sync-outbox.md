# Feature Brief: Local-First Sync Outbox

## Goal

Let cloud-mode authors keep writing when Supabase is temporarily offline or slow by recording cloud-write intent locally and replaying it later.

## Context

The app already has static-first boot, PWA-lite app-shell caching, and IndexedDB editor autosave. Those protect the UI shell and active text, but before this feature explicit cloud writes still failed without a durable retry path.

Relevant files:

- `src/lib/syncOutbox.ts`
- `src/lib/syncOutboxStorage.ts`
- `src/store/localPostState.ts`
- `src/store/syncReplay.ts`
- `src/store/useAppStore.ts`
- `src/store/cloudData.ts`
- `src/App.tsx`
- `src/components/Nav.tsx`

## Non-Goals

- Background Sync API.
- Service worker caching for Supabase, auth, Telegram SDK, or private user data.
- Cross-device merge UI.
- Offline capsule opening.
- WYSIWYG storage or schema changes.

## In Scope

- Store pending cloud write operations in IndexedDB with localStorage fallback.
- Queue `saveDraft`, `bankPost`, `updateBankedPost`, and `archivePost` when cloud writes fail.
- Replay queued operations from the app runtime on hydration and browser `online`.
- Preserve client-generated post ids so replay can `upsert` the same post.
- Show a compact sync status in the navigation.

## Out Of Scope

- Queuing `openCapsule`.
- Syncing every autosave keystroke to Supabase.
- Resolving simultaneous edits from two devices.

## Acceptance Criteria

- A failed cloud draft save creates a durable outbox entry and keeps the post visible locally.
- A failed cloud bank action updates local progress immediately and replays `bank_post` later without double-counting already-banked cloud posts.
- A failed banked-post update/archive queues locally and remains visible in the local UI immediately.
- Queued operations survive reload.
- Users can see when operations are waiting for cloud or need retry.

## Files Likely Involved

- `src/lib/syncOutbox.ts`
- `src/lib/syncOutboxStorage.ts`
- `src/lib/syncOutbox.test.ts`
- `src/store/localPostState.ts`
- `src/store/syncReplay.ts`
- `src/store/useAppStore.ts`
- `src/store/cloudData.ts`
- `src/App.tsx`
- `src/components/Nav.tsx`
- `src/styles/base.css`
- `src/styles/responsive.css`

## Tests Required

- Unit tests for enqueue/list/replayable states.
- Unit tests for syncing, failed, and synced state transitions.
- Build/type check for store and Supabase upsert changes.
- Future Playwright reconnect test when cloud mocking is stable.

## Risks

- `bankPost` replay must not double-count if the cloud row is already `banked`.
- Local optimistic progress can temporarily differ from cloud until replay succeeds.
- Multi-tab replay is not locked across tabs in v1.
- Conflict handling is visible as a state bucket, but there is no merge UI yet.

## Verification

- `npm test`
- `npm run build`
- `npm run quality`
- Manual QA: start cloud session, block network, save draft/bank post, confirm nav sync pill, restore network, click retry or trigger `online`, confirm state hydrates from cloud.

## Notes For LLM Agent

- Do not move outbox writes into the service worker.
- Do not weaken `src/lib/editorBuffer.ts`; editor autosave and outbox solve different problems.
- Add an ADR for changes to outbox semantics or conflict policy.
