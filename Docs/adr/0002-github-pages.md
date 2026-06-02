# ADR 0002: GitHub Pages Deployment

## Status

Accepted.

## Decision

Deploy the SPA to GitHub Pages through GitHub Actions.

## Context

The app has no custom backend. Supabase provides backend services, so GitHub Pages is enough for MVP hosting.

## Consequences

- Vite must build with `VITE_BASE_PATH=/Motivation-Blues/`.
- Magic-link redirects must target `https://llayon.github.io/Motivation-Blues/`.
- Future route-based navigation must account for GitHub Pages SPA limitations.
- Server-only features would require a different host or external functions.
