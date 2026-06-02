# Test Matrix

## Unit
- Season daily goal schedule.
- Total planned posts after 40 days.
- Milestone crossing.
- Level calculation.
- Export formatting.
- Bank tag counts and filter semantics.
- Telegram-style formatting helpers and safe-link parsing.
- Cloud hydration timeout helper.
- LLM workflow scripts: `npm run verify`, `npm run verify:pages`, and `npm run docs:changed-check`.
- ADR enforcement script: `npm run adr:check`.

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
- Simulate unavailable Supabase and confirm the app leaves the startup loader.
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
- Cloud hydration failure falls back to the start screen instead of blocking the app.

## Supabase
- `npx supabase migration list` shows local/remote parity.
- User can read own rows.
- User cannot access another user's rows.
- `bank_post` is idempotent for already-banked posts.
- `open_capsule` rejects opened or foreign capsules.
- Startup remains usable if Supabase Auth/REST is unavailable or slow.

## LLM Workflow
- `Docs/CODEMAP.md` points to current implementation files.
- `Docs/TRACEABILITY.md` links requirements to tests.
- `Docs/BOUNDARIES.md` matches architectural rules in `AGENTS.md`.
- `Docs/REGRESSIONS.md` records fixed bugs and guardrails.
- `Docs/COPY_GUIDE.md` matches product tone in `Docs/PRODUCT_SPEC.md`.
- `Docs/HANDOFF.md` is updated after substantial workflow, architecture, or product changes.
- `npm run docs:changed-check` emits a warning, not a failure, when code changes have no docs changes.
- `npm run adr:check` fails when architecture-sensitive files change without an ADR update.

## Deployment
- `npm test`.
- `npm run verify`.
- `npm run test:e2e`.
- `npm run build`.
- `npm run verify:pages`.
- `npm run search:assist -- "bankPost"` returns code/docs locations.
- `npm run commitlint:last` after committing.
- GitHub Actions deploy succeeds.
- Production URL returns HTTP 200.
