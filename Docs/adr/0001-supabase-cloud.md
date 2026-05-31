# ADR 0001: Supabase Cloud Backend

## Status
Accepted.

## Decision
Use Supabase Auth, Postgres, RLS, and RPC as the backend for the MVP.

## Context
The product needs user accounts, private post storage, season progress, capsules, and inventory. A custom server would add overhead and is not required for the current static SPA.

## Consequences
- Frontend can deploy as static files.
- Security depends heavily on RLS.
- Database behavior should live in migrations and RPC.
- Service-role keys must never enter frontend code.
