# Risk Register

## Magic Link Redirect

Risk: Supabase redirects user to wrong path and the app does not hydrate session.
Mitigation: Keep `https://llayon.github.io/Motivation-Blues/` in `supabase/config.toml` and use `import.meta.env.BASE_URL` when creating magic links.

## RLS Regression

Risk: users can access another user's rows.
Mitigation: keep owner-based policies and avoid service-role frontend usage.

## Autosave Regression

Risk: editor loses active text or restores stale text after banking.
Mitigation: keep IndexedDB buffer, ordered writes, and clear buffer on successful bank/new editor.

## Cloud Hydration Stall

Risk: Supabase Auth or REST requests hang and make the static app feel unavailable.
Mitigation: render the local/static shell before cloud hydration, bound cloud calls with a short timeout, preserve local state when available, and expose retry from the Auth gate.

## Third-Party Startup Blocker

Risk: a third-party SDK delays the first React render or fails before the app shell is visible.
Mitigation: do not put third-party scripts in `index.html`; dynamically load Telegram SDK only when launch parameters indicate a Telegram Mini App session.

## Large JS Bundle

Risk: Three/R3F inflate initial load.
Mitigation: lazy-load capsule and collection screens.

## Stale Service Worker Cache

Risk: a deployed update is hidden behind an older cached app shell.
Mitigation: keep navigation network-first, version service worker cache names, delete old caches on activation, and smoke-test production after deploy.

## PWA Offline Sync Confusion

Risk: users expect installability to mean cloud writes work offline.
Mitigation: document PWA-lite as app-shell caching only; route supported offline cloud writes through the app-runtime outbox, not the service worker.

## Outbox Divergence

Risk: local optimistic posts/progress differ from Supabase until queued writes replay.
Mitigation: keep a visible sync pill, replay on hydration and browser `online`, use stable post ids with Supabase `upsert`, and make `bankPost` replay check cloud status before calling `bank_post`.

## Outbox Conflict UX

Risk: the same post is changed from another device before queued local writes replay.
Mitigation: v1 exposes failed/conflict status buckets but does not auto-merge; add explicit conflict resolution before supporting multi-device offline editing as a product promise.

## GitHub Pages Subpath

Risk: assets break because Vite base path is wrong.
Mitigation: keep `VITE_BASE_PATH=/Motivation-Blues/` in workflow and verify Pages build locally.

## Applied Migration Editing

Risk: editing old migrations diverges local and remote schema history.
Mitigation: add new migrations only.
