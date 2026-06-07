# Feature Brief

## Goal

Make Motivation Blues installable and faster on repeat visits by caching the static app shell and already loaded Vite assets.

## Context

The app is a static GitHub Pages SPA with static-first boot and local-first editor autosave. Supabase cloud sync still requires network access, but the writing room should open even when the network is unreliable.

## Non-Goals

- No offline cloud write queue.
- No background sync.
- No Supabase API caching.
- No push notifications.
- No app-store packaging.

## In Scope

- Web app manifest.
- Installable icons including maskable icon.
- Manual service worker.
- App shell and static asset cache.
- Offline navigation fallback to cached app shell.
- Service worker registration that respects `VITE_BASE_PATH` for GitHub Pages.
- Automated smoke tests for manifest and service worker assets.

## Out Of Scope

- Local-to-cloud merge.
- Cross-device conflict resolution.
- Offline banking RPC replay.
- Runtime update toast.

## Acceptance Criteria

- `index.html` links a valid manifest.
- Manifest includes standalone display, theme/background colors, start URL, scope, and required icons.
- `sw.js` is served from the app base path.
- Service worker caches the app shell and static same-origin assets.
- Normal cloud writes still fail visibly when offline; they are not silently queued.
- `npm run verify:pages` works with `VITE_BASE_PATH=/Motivation-Blues/`.

## Files Likely Involved

- `index.html`
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/`
- `src/lib/registerServiceWorker.ts`
- `src/main.tsx`
- `tests/e2e/local-writing-flow.spec.ts`

## Tests Required

- Unit tests for service worker registration helpers.
- Playwright smoke for manifest and service worker asset availability.
- `npm run quality:full`.

## Risks

- Stale app shell after deploy.
- Service worker path/scope bugs under GitHub Pages subpath.
- Users may expect offline cloud sync after seeing installability.

## Verification

- `npm run quality:full`.
- `npm run verify:pages`.
- Manual production smoke: install app, reload, then disable network and confirm cached shell opens.

## Notes For LLM Agent

- Do not add offline Supabase write replay in this feature.
- Preserve IndexedDB editor autosave semantics.
- Keep service worker cache same-origin only.
