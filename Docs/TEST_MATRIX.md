# Test Matrix

## Unit

- Season daily goal schedule.
- Total planned posts after 40 days.
- Milestone crossing.
- Level calculation.
- Export formatting.
- Bank tag counts and filter semantics.
- Telegram-style formatting helpers and safe-link parsing.
- Telegram launch parameter detection.
- PWA service worker registration helpers.
- Local-first sync outbox fallback queueing and state transitions.
- Cloud hydration timeout helper.
- Route crash report creation, storage, malformed reads, formatting, and clipboard copy.
- Manual diagnostics snapshot creation, service-worker fallback, and privacy sanitization.
- Route error boundary fallback, crash report copy, and editor buffer survival through Playwright.
- LLM workflow scripts: `npm run verify`, `npm run verify:pages`, and `npm run docs:changed-check`.
- ADR enforcement script: `npm run adr:check`.
- Code quality scripts: `npm run format:check`, `npm run lint`, `npm run architecture:check`, `npm run size:check`, and `npm run deadcode`.
- Production smoke checks published GitHub Pages shell, static assets, Telegram SDK gating, and Diagnostics Hub sanitization.

## Manual Smoke

- Open production URL.
- Request magic link.
- Return to app after auth.
- Create draft.
- Reload editor and verify IndexedDB recovery.
- Save draft.
- Apply editor formatting for bold, italic, and link.
- Save to bank.
- Edit a banked post and confirm progress/capsules do not change.
- Search banked posts by text.
- Filter banked posts by one or more tag chips.
- Verify progress increments.
- Meet daily goal and verify sealed capsule appears.
- Open capsule and verify collection updates.
- Export banked posts.
- Confirm export keeps raw Telegram-style markup.
- Simulate unavailable Supabase and confirm the static/start screen appears immediately while cloud sync fails in the background.
- Confirm normal browser startup does not request the Telegram SDK.
- Confirm first production editor open does not visibly wait on lazy chunk loading after the landing page has painted.
- Confirm Telegram Mini App startup requests fullscreen when the client exposes the fullscreen API.
- Open `?debug=1`, copy diagnostics, and confirm no email, post text, query values, hash values, or tokens appear.
- Simulate a route render error and confirm the fallback appears while navigation and editor buffer recovery still work.
- Install the PWA from production when supported.
- Reload once, disable network, and confirm the cached app shell opens.
- In cloud mode, block Supabase network, save draft/bank/update/archive, confirm local state updates and the nav sync pill appears.
- Restore network or click the sync pill and confirm queued cloud writes replay, then the pill clears after hydration.
- For workflow/doc changes, review `Docs/CODEMAP.md`, `Docs/TRACEABILITY.md`, `Docs/BOUNDARIES.md`, and `Docs/COMMIT_CHECKLIST.md` for consistency.

## Playwright E2E

- Local mode starts without Supabase session.
- IndexedDB autosave restores active editor buffer after reload.
- Banked posts increment visible progress.
- Daily goal creates sealed capsule.
- Capsule can be opened into a collectible.
- Collection shows owned item.
- Export preview includes banked posts.
- Banked post can be edited without adding progress or capsules.
- Bank tag chips and search navigate banked posts.
- Opening a banked post for edit does not silently overwrite an unrelated autosave buffer.
- Editor formatting menu inserts raw markup and Bank preview renders it safely.
- Draft selection asks before replacing an unfinished manuscript.
- Manual diagnostics screen opens from `?debug=1`, copies a sanitized support snapshot, and returns to normal flow.
- Route error boundary shows fallback, stores/copies a local crash report, and does not lose IndexedDB editor buffer.
- Cloud hydration failure still renders the static/start screen instead of blocking first render.
- Normal browser startup does not request Telegram SDK.
- PWA manifest and service worker assets are available.
- Telegram Mini App startup mounts `AuthGate`, requests fullscreen when supported, and starts `telegram-auth` without waiting for root cloud hydration.
- Capsule and collection routes lazy-load reward chunks without breaking navigation.
- Future: cloud offline write/reconnect replay E2E once Supabase mocking is stable.

## Supabase

- `npx supabase migration list` shows local/remote parity.
- User can read own rows.
- User cannot access another user's rows.
- `bank_post` is idempotent for already-banked posts.
- `open_capsule` rejects opened or foreign capsules.
- Startup remains usable if Supabase Auth/REST is unavailable or slow.
- Cloud post writes use stable ids and `upsert` so queued draft/bank/update replay can create or update the same row.

## LLM Workflow

- `Docs/CODEMAP.md` points to current implementation files.
- `Docs/TRACEABILITY.md` links requirements to tests.
- `Docs/BOUNDARIES.md` matches architectural rules in `AGENTS.md`.
- `Docs/REGRESSIONS.md` records fixed bugs and guardrails.
- `Docs/COPY_GUIDE.md` matches product tone in `Docs/PRODUCT_SPEC.md`.
- `Docs/HANDOFF.md` is updated after substantial workflow, architecture, or product changes.
- `npm run docs:changed-check` emits a warning, not a failure, when code changes have no docs changes.
- `npm run adr:check` fails when architecture-sensitive files change without an ADR update.
- `npm run quality` runs the normal local quality gate.
- `npm run quality:full` adds E2E, Pages build, and dead-code reporting.
- `npm run size:check` is advisory unless `SIZE_BUDGET_STRICT=1` is set.
- `npm run size:check` should be clean for current source budgets.
- `npm run deadcode` uses Knip in report-only mode and should be clean unless a deliberate exception is documented.

## Deployment

- `npm test`.
- `npm run format:check`.
- `npm run lint`.
- `npm run architecture:check`.
- `npm run size:check`.
- `npm run quality`.
- `npm run verify`.
- `npm run test:e2e`.
- `npm run build`.
- `npm run verify:pages`.
- Build output keeps the main `index` chunk below 500 kB and emits the 3D chunk separately.
- Pages build includes `manifest.webmanifest`, `sw.js`, and icon assets.
- `npm run search:assist -- "bankPost"` returns code/docs locations.
- `npm run commitlint:last` after committing.
- GitHub Actions deploy succeeds.
- Production URL returns HTTP 200.
- `npm run test:prod-smoke` passes after GitHub Pages deploy.
- GitHub Actions `production-smoke` job succeeds.
