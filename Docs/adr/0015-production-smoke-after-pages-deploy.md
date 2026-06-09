# ADR 0015: Production Smoke After Pages Deploy

## Status

Accepted.

## Decision

Motivation Blues runs a small unauthenticated Playwright production smoke suite against the published GitHub Pages URL after the deploy job finishes.

Production smoke uses:

- `playwright.prod.config.ts`;
- `tests/prod-smoke/production.spec.ts`;
- `npm run test:prod-smoke`;
- `PROD_SMOKE_BASE_URL` override for non-default targets.

The GitHub Actions Pages workflow runs the smoke job after `actions/deploy-pages` and passes the deployed `page_url` as `PROD_SMOKE_BASE_URL`.

## Context

Local checks already cover source quality, unit logic, local Playwright flows, and GitHub Pages base-path build output. They do not prove that the final published URL serves the current app shell, manifest, service worker, and hidden Diagnostics Hub.

Production failures we care about include stale service worker state, Pages base-path issues, root cloud-loader regressions, accidental Telegram SDK loading in normal browsers, and Diagnostics Hub sanitization regressions.

## Consequences

- Deploys get an automated published-URL smoke signal.
- The smoke suite remains unauthenticated and does not mutate Supabase data.
- CI takes longer because it installs Playwright browsers in the post-deploy job.
- GitHub Pages propagation/network flakiness can fail smoke even when source is valid; rerun before changing app code.

## Verification

- `npm run quality`.
- `npm run verify:pages`.
- `npm run test:prod-smoke` when network access is available.
- GitHub Actions `production-smoke` job after deploy.
