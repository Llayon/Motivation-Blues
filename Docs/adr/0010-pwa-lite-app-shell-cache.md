# ADR 0010: PWA-Lite App Shell Cache

## Status

Accepted.

## Decision

Motivation Blues ships a PWA-lite layer: a web app manifest, installable icons, a manually maintained service worker, and a same-origin static asset cache.

The service worker uses:

- network-first handling for navigation requests, with cached app shell fallback;
- cache-first handling for same-origin Vite assets, manifest, and icons;
- a `CACHE_URLS` message from the app runtime to cache hashed Vite assets discovered on the current page.

The service worker must not cache Supabase API responses, Telegram SDK responses, or cross-origin requests. PWA-lite does not implement offline cloud sync, background sync, or conflict resolution.

## Context

The app already has static-first boot and IndexedDB editor autosave, so a cached app shell improves perceived reliability and repeat-load speed. GitHub Pages deployment requires service worker registration and manifest URLs to respect the Vite base path (`/Motivation-Blues/` in production).

Using a manual service worker avoids introducing a new build dependency, but means hashed build assets are not known at authoring time. The app therefore reports already loaded same-origin assets to the active worker after registration.

## Consequences

- The app can be installed as a standalone PWA.
- Repeat visits can load the static shell and route chunks from cache.
- Offline navigation can show the cached app shell, preserving access to local editor recovery.
- Cloud writes still require network and may fail visibly.
- Service worker update behavior must be tested after deploys to avoid stale app shell confusion.
- A future offline sync queue requires a separate ADR because it changes storage and conflict semantics.

## Verification

- Unit tests for service worker asset collection helpers.
- Playwright smoke for manifest and `sw.js` availability.
- `npm run verify:pages` to confirm GitHub Pages base-path build.
- Manual production smoke: install app, reload once, disable network, and confirm the cached shell opens.
