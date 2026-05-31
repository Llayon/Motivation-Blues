# Test Matrix

## Unit
- Season daily goal schedule.
- Total planned posts after 40 days.
- Milestone crossing.
- Level calculation.
- Export formatting.

## Manual Smoke
- Open production URL.
- Request magic link.
- Return to app after auth.
- Create draft.
- Reload editor and verify IndexedDB recovery.
- Save draft.
- Save to bank.
- Verify progress increments.
- Meet daily goal and verify sealed capsule appears.
- Open capsule and verify collection updates.
- Export banked posts.

## Playwright E2E
- Local mode starts without Supabase session.
- IndexedDB autosave restores active editor buffer after reload.
- Banked posts increment visible progress.
- Daily goal creates sealed capsule.
- Capsule can be opened into a collectible.
- Collection shows owned item.
- Export preview includes banked posts.

## Supabase
- `npx supabase migration list` shows local/remote parity.
- User can read own rows.
- User cannot access another user's rows.
- `bank_post` is idempotent for already-banked posts.
- `open_capsule` rejects opened or foreign capsules.

## Deployment
- `npm test`.
- `npm run test:e2e`.
- `npm run build`.
- GitHub Pages base-path build.
- GitHub Actions deploy succeeds.
- Production URL returns HTTP 200.
