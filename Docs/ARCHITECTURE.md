# Architecture

## Runtime Shape

The app is a static SPA deployed to GitHub Pages. Supabase provides Auth, Postgres, RLS, and RPC. There is no custom Node backend.

## Frontend

- Entry: `src/main.tsx`.
- Root view routing: `src/App.tsx` with Zustand `activeView`; product route screens are lazy-loaded.
- UI components: `src/components/`.
- Domain constants and helpers: `src/lib/`, `src/data/`.
- Global state: `src/store/useAppStore.ts`; cloud mapping/loading helpers live in `src/store/cloudData.ts`.

## State Flow

1. `App` waits only for Zustand persist hydration, renders the local/static shell, and then runs Supabase session hydration in the background if Supabase env is configured.
2. `useAppStore` loads profile, posts, daily progress, capsules, and inventory.
3. UI reads state directly from Zustand.
4. Cloud mode writes posts and reward actions through Supabase tables/RPC.
5. Supported cloud write failures for draft/bank/update/archive are recorded in the local sync outbox and replayed later.
6. Local mode keeps the same behavior in local Zustand persistence.
7. If cloud hydration stalls or fails, the app fails open: the first screen remains usable, local data is preserved when present, and the Auth gate lets the user continue locally or retry cloud sync.

## Telegram Mini App Startup

- File: `src/lib/telegramApp.ts`.
- `src/main.tsx` starts non-blocking Telegram environment initialization.
- `src/lib/telegramApp.ts` loads the Telegram Web App SDK dynamically only when Telegram launch parameters are present.
- When a Telegram WebApp object is available, init calls `ready()`, `expand()`, and optional `requestFullscreen()` for clients that support fullscreen mode.
- `AuthGate` waits for the dynamic SDK state, then reads `window.Telegram.WebApp.initData` and starts `startTelegramSession`.
- `App` must not render a blocking Supabase boot loader before `AuthGate`; otherwise Telegram auth cannot start and normal browser users wait on cloud before seeing static UI.
- Root Supabase hydration can still run from auth-state changes after Telegram sign-in.

## Editor Autosave

- Buffer file: `src/lib/editorBuffer.ts`.
- UI/controller files: `src/components/ZenEditor.tsx`, `src/components/editor/useZenEditorController.ts`, and `src/components/editor/*`.
- Storage: IndexedDB object store `active-editor-buffers`.
- Key: `userId`.
- Fallback: `localStorage`.
- Purpose: protect active text even before draft/bank save.
- Save behavior: every title/content/tag change writes to the local buffer.
- Clear behavior: explicit new editor or successful bank save clears the buffer.
- Banked edit flow: `Bank` calls `openPostInEditor(postId)`, Zustand stores `editorTargetPostId`, and `ZenEditor` loads that post after checking the local buffer.
- Conflict behavior: unrelated emergency buffers are kept visible until the user explicitly keeps the buffer or opens the selected draft/banked post.

## Local-First Cloud Outbox

- Outbox API: `src/lib/syncOutbox.ts`.
- Outbox storage adapter: `src/lib/syncOutboxStorage.ts`.
- Storage: IndexedDB database `motivation-blues-sync-outbox`, object store `sync-operations`.
- Fallback: `localStorage`.
- Scope: cloud-mode `saveDraft`, `bankPost`, `updateBankedPost`, and `archivePost`.
- Local optimistic post/progress state helpers: `src/store/localPostState.ts`.
- Replay helper: `src/store/syncReplay.ts`.
- UI status: `src/components/Nav.tsx` shows waiting/syncing/retry counts when queued operations exist.
- Replay triggers: successful authenticated cloud hydration and browser `online` from `src/App.tsx`.
- Post writes use stable client-generated ids and Supabase `upsert` so replay can create or update the same row.
- `bankPost` replay checks current cloud post status before calling `bank_post` to avoid double-counting an already-banked post.
- `openCapsule` remains online-only in v1 because reward rolls need a separate idempotency/conflict policy.

## Editor Formatting

- Content remains a plain `string`; no Supabase or IndexedDB schema change is required.
- Formatting helper: `src/lib/telegramFormatting.ts`.
- Supported markup: `*bold*`, `_italic_`, `[text](url)`.
- `ZenEditor` applies markup to the selected textarea range from a floating menu.
- Bank preview renderer: `src/components/TelegramMarkup.tsx`.
- Preview rendering must not use `dangerouslySetInnerHTML`.
- Safe clickable links are limited to `http`, `https`, and `mailto`.
- Export keeps raw markup.

## Bank Navigation

- Component: `src/components/Bank.tsx`.
- Filtering helper: `src/lib/bankFilters.ts`.
- Search checks post title, content, and tags.
- Tag filters use AND semantics for multiple selected tags.
- Updating an existing banked post uses `updateBankedPost` and must not call reward/progress banking logic.
- Bank cards render supported Telegram-style markup through `TelegramMarkup`.

## Supabase

- Client: `src/services/supabase.ts`.
- Cloud data loading and post persistence helpers: `src/store/cloudData.ts`.
- Store actions, local mode, and RPC orchestration: `src/store/useAppStore.ts`.
- Cloud boot timeout helper: `src/lib/cloudHydration.ts`.
- Initial boot hydration should run in background mode (`blockUi: false`) so the first render is static-first. `CLOUD_HYDRATION_TIMEOUT_MS` bounds background/auth refreshes and explicit retry actions.
- Hydration uses an internal request id so late responses from older Supabase requests cannot overwrite newer app state.
- Migrations: `supabase/migrations/`.
- Config: `supabase/config.toml`.
- Project ref: `ryvvthzzlnbejyvlrqup`.

## RPC Responsibilities

- `bank_post(post_id)`: transitions a post from draft to banked, updates season counters, creates daily/milestone capsules.
- `open_capsule(capsule_id)`: validates ownership, rolls rarity, creates inventory row, marks capsule opened.

## Deployment

- Workflow: `.github/workflows/deploy-pages.yml`.
- Base path: `VITE_BASE_PATH=/Motivation-Blues/`.
- URL: `https://llayon.github.io/Motivation-Blues/`.
- Supabase magic-link redirects must include the same URL and local dev URLs.

## PWA-Lite

- Manifest: `public/manifest.webmanifest`.
- Service worker: `public/sw.js`.
- Registration helper: `src/lib/registerServiceWorker.ts`.
- `index.html` links the manifest and theme metadata through Vite `BASE_URL`.
- Service worker registration uses `import.meta.env.BASE_URL` so GitHub Pages scope remains `/Motivation-Blues/`.
- The worker caches same-origin app shell/assets only; Supabase, Telegram SDK, and other cross-origin requests are not cached.
- PWA-lite is installability and static-shell caching. Offline cloud write replay is handled by the app-runtime outbox, not the service worker.

## 3D

- Files: `src/components/CapsuleQueue.tsx`, `src/components/Collection.tsx`, `src/components/VoxelShowcase.tsx`.
- `CapsuleQueue` and `Collection` are imported with `React.lazy` from `src/App.tsx` so Three/R3F is not part of the initial auth/dashboard/editor route.
- Current implementation uses procedural placeholder voxel-style meshes.
- Future GLTF assets should preserve source materials; lighting can be adjusted but model materials should not be rewritten unless deliberately updating asset art.
