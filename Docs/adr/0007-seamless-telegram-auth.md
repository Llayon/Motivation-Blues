# ADR 0007: Seamless Telegram Auth

## Status

Accepted.

## Decision

Implement seamless authentication for Telegram Mini App (TMA) users using a Supabase Edge Function to validate Telegram's `initData`. The client automatically triggers this flow when running inside Telegram. Authentication uses deterministic email/password credentials generated from the Telegram ID and Bot Token, ensuring a standard Supabase session without custom JWT complexity.

## Context

The existing Magic Link (email-based) authentication breaks the user experience inside Telegram, as links open in external browsers rather than the мессенджер. To maintain a "zero-click" and frictionless experience, we need to leverage Telegram's native identity provision while staying within the Supabase Auth ecosystem.

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
