# Production Smoke Checklist

Use this after GitHub Pages deploys `main`.

Production URL:

```text
https://llayon.github.io/Motivation-Blues/
```

## Automated

Run against the published GitHub Pages app:

```bash
npm run test:prod-smoke
```

Optional custom target:

```bash
PROD_SMOKE_BASE_URL=https://llayon.github.io/Motivation-Blues/ npm run test:prod-smoke
```

The automated smoke checks:

- production `index.html` returns OK;
- `manifest.webmanifest` returns OK and has the expected app name;
- `sw.js` returns OK and contains the static-shell cache message contract;
- normal browser startup does not request the Telegram SDK;
- the static/start shell appears without the blocking Supabase loader;
- `?debug=1` opens Diagnostics Hub;
- diagnostics preview and clipboard copy sanitize query/hash values.

## Manual

1. Open `https://llayon.github.io/Motivation-Blues/`.
2. Confirm the start page renders quickly and does not stay on a cloud loader.
3. Open `https://llayon.github.io/Motivation-Blues/?debug=1&access_token=fake#refresh_token=fake`.
4. Click `Скопировать диагностику`.
5. Paste into a scratch note and confirm `fake`, email, post text, and tokens are absent.
6. Confirm Diagnostics Hub reports service worker state as `registered`, `missing`, or `unavailable` without crashing.
7. Open the app inside Telegram Mini App.
8. Confirm the app expands/fullscreen when supported and does not block on root Supabase hydration.
9. If production looks stale, hard reload once and retest `?debug=1`; stale service worker behavior should be investigated before shipping more changes.

## CI

`.github/workflows/deploy-pages.yml` runs `npm run test:prod-smoke` after the GitHub Pages deploy job.

If production smoke fails:

- check the failed Playwright trace/screenshot artifact;
- verify the Pages deployment URL from the GitHub Actions environment;
- compare the Diagnostics Hub build SHA against the latest commit;
- inspect service worker state in the copied diagnostics snapshot;
- rerun manually after a short Pages propagation delay before changing app code.
