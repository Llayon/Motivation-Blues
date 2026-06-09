# Feature Brief

## Goal

Add repeatable post-deploy verification for the published GitHub Pages app.

## Context

Local `quality`, E2E, and Pages build checks prove source and build correctness, but they do not prove the deployed GitHub Pages URL serves the expected app shell, service worker, manifest, and Diagnostics Hub.

## Non-Goals

- No authenticated production user flow.
- No Telegram Bot API interaction.
- No Supabase data mutation.
- No private content checks.

## In Scope

- Add a production Playwright config without a local web server.
- Add smoke tests against `https://llayon.github.io/Motivation-Blues/`.
- Add `npm run test:prod-smoke`.
- Run production smoke after the Pages deploy job in GitHub Actions.
- Document manual and automated smoke steps.

## Out Of Scope

- Cross-browser production matrix.
- Visual snapshot regression.
- Authenticated cloud contract tests.
- Synthetic Telegram client automation.

## Acceptance Criteria

- `npm run test:prod-smoke` targets the production URL by default.
- `PROD_SMOKE_BASE_URL` can override the target URL.
- Production smoke checks the start shell, static assets, lack of Telegram SDK request in normal browser startup, and Diagnostics Hub sanitization.
- GitHub Actions runs production smoke after deploy.
- Documentation explains manual fallback steps.

## Files Likely Involved

- `playwright.prod.config.ts`
- `tests/prod-smoke/production.spec.ts`
- `package.json`
- `.github/workflows/deploy-pages.yml`
- `Docs/PRODUCTION_SMOKE.md`

## Tests Required

- `npm run test:prod-smoke` when network access to GitHub Pages is available.
- Existing `npm run quality`.
- Existing `npm run verify:pages`.

## Risks

- GitHub Pages propagation can make post-deploy smoke temporarily flaky.
- Production smoke depends on public network availability.
- Tests must avoid mutating real Supabase user data.

## Verification

- `npm run quality`
- `npm run verify:pages`
- `npm run test:prod-smoke`

## Notes For LLM Agent

- Keep production smoke unauthenticated unless a future ADR accepts safe production test accounts.
- Do not add real user data, secrets, or service-role keys to production smoke.
