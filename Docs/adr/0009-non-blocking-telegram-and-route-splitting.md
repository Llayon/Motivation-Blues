# ADR 0009: Non-Blocking Telegram SDK And Route Splitting

## Status

Accepted.

## Decision

The app must not load the Telegram Web App SDK as a blocking script in `index.html`. Telegram SDK loading is owned by `src/lib/telegramApp.ts` and only starts when the URL contains Telegram launch parameters or `window.Telegram.WebApp` is already present.

When a Telegram WebApp object is ready, startup calls `ready()`, `expand()`, and optional `requestFullscreen()` if the client exposes the fullscreen API. `expand()` remains the fallback for older Telegram clients.

Product route components beyond the auth shell and navigation are loaded with `React.lazy` from `src/App.tsx`. This keeps editor, bank, season, export, capsule, and collection screens out of the first route until the user or persisted state needs them.

## Context

Static-first boot removed the Supabase wait from first render, but a synchronous third-party script in the document head could still delay React startup for normal browser users. The app also imported several non-current screens eagerly even though first launch usually shows the auth/start shell.

Telegram Mini App support still requires `window.Telegram.WebApp.initData`, so SDK loading cannot be removed entirely. It needs to be dynamic and coordinated with `AuthGate` so Telegram auto-login still begins when the SDK becomes available.

## Consequences

- Ordinary browser startup no longer requests Telegram SDK.
- Telegram Mini App startup has a short "loading Telegram" state before auto-login begins.
- Telegram Mini App startup requests fullscreen when supported while still working on older expanded-only clients.
- Route chunks load on demand, reducing initial route work.
- A future Supabase client/store split is still needed to remove `@supabase/supabase-js` from the main graph.
- Startup tests must cover both ordinary browser and Telegram launch URLs.

## Verification

- Unit tests for Telegram launch parameter detection.
- Unit tests for Telegram fullscreen request and fallback behavior.
- Playwright test confirms ordinary browser startup does not request Telegram SDK.
- Playwright test confirms Telegram Mini App startup dynamically loads SDK, requests fullscreen, and starts `telegram-auth`.
- `npm run quality:full`.
