# ADR 0007: Seamless Telegram Auth

## Status

Accepted.

## Decision

Implement seamless authentication for Telegram Mini App (TMA) users using a Supabase Edge Function to validate Telegram's `initData`. The client automatically triggers this flow when running inside Telegram. Authentication uses deterministic email/password credentials generated from the Telegram ID and Bot Token, ensuring a standard Supabase session without custom JWT complexity.

Additionally, the application hydration logic was refactored to prevent startup hangs by:

1. Adding a 5-second timeout (`withCloudTimeout`) to all Telegram auth network calls.
2. Making the `hydrateFromSupabase` store action race-resilient, ensuring that pre-empted requests do not leave the UI in a perpetual "hydrating" state.
3. Optimizing the root `onAuthStateChange` listener in `App.tsx` to avoid redundant and potentially looping hydration triggers.

## Context

The existing Magic Link (email-based) authentication breaks the user experience inside Telegram, as links open in external browsers rather than the мессенджер. To maintain a "zero-click" and frictionless experience, we need to leverage Telegram's native identity provision while staying within the Supabase Auth ecosystem.

Initial integration revealed that concurrent hydration requests (e.g., boot hydration vs. auth state change) could race, potentially leaving the loading screen active indefinitely if a pre-empted request was the one holding the UI lock. Lack of timeouts on Edge Function calls also posed a risk of hanging the app during cold starts or network issues.

## Consequences

- A new Supabase Edge Function `telegram-auth` is added.
- The `AppState` in `useAppStore` includes a new `startTelegramSession` action.
- `AuthGate` component automatically detects TMA environment and attempts login.
- Users are created in Supabase Auth via the Admin API using a deterministic pattern (`tma_{id}@motivation-blues.local`).
- Security relies on HMAC signature validation of `initData` using the `TELEGRAM_BOT_TOKEN`.
- Fallback to standard email login remains active if Telegram auth fails.

## Verification

- `npm run build`
- `npm run test`
- Edge Function code validation using Web Crypto API.
- E2E smoke tests (future work: mock window.Telegram).
