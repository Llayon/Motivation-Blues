# ADR 0008: Static-First Boot

## Status

Accepted.

## Decision

The app must render the local/static shell immediately after Zustand persist hydration. Initial Supabase session hydration runs in the background with `blockUi: false`; it must not show the fullscreen cloud loader or prevent `AuthGate` from mounting.

Only the short local persist restoration splash can appear during startup. Cloud state may update the profile, posts, progress, capsules, and inventory after the first screen is already usable.

## Context

Motivation Blues is deployed as a static GitHub Pages SPA. The writing experience should feel available within about a second, especially in Telegram Mini App and mobile contexts where network conditions, Supabase cold starts, provider latency, or Edge Function requests can take several seconds.

The previous fail-open hydration bounded cloud waiting with timeouts, but normal browser startup could still show the Supabase loading card while cloud checks were in progress. That preserved correctness, but hurt perceived performance and made a static app feel dependent on cloud boot.

Telegram Mini App startup also requires `AuthGate` to mount before Telegram auto-login can begin, so root cloud loading is the wrong ordering primitive.

## Consequences

- First paint becomes local-first and does not wait for Supabase Auth or REST.
- Local mode, email auth UI, and Telegram auth can start while cloud sync is pending.
- Returning cloud users may briefly see the landing/auth shell before the background session check restores their cloud profile.
- Cloud errors should be surfaced through retry/status UI, not as a blocking startup state.
- Future boot changes must not reintroduce a root Supabase loader for initial hydration.

## Verification

- `npm run quality:full`.
- Playwright cloud fallback test confirms the landing shell renders while Supabase Auth/REST requests fail.
- Playwright Telegram Mini App test confirms `AuthGate` mounts and starts `telegram-auth` without waiting for root Supabase hydration.
