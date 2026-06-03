# Project Memory

## Current State

- MVP app implemented with React, TypeScript, Vite, Zustand, Supabase, R3F, and GitHub Pages.
- Supabase project `Motivation blues` exists in region `eu-central-1`.
- GitHub repository exists at `https://github.com/Llayon/Motivation-Blues`.
- Production URL is `https://llayon.github.io/Motivation-Blues/`.
- GitHub Pages deploy runs through `.github/workflows/deploy-pages.yml`.

## Implemented Features

- Supabase Auth magic-link flow.
- Telegram Mini App (TMA) integration (SDK initialization, expanded viewport) so the app runs natively inside Telegram.
- Seamless Telegram Auth via Supabase Edge Functions, providing zero-click auto-login for TMA users without email entry.
- Cloud-backed posts, progress, capsules, and inventory.
- Local fallback mode for browser-only sessions.
- 40-day season with 100 banked posts.
- Daily goals: days 1-10 = 2 posts, days 11-30 = 3 posts, days 31-40 = 2 posts.
- 20-level Season Pass, 5 posts per level.
- Static classic feedback phrases, organized by distinct motivational personas (no AI).
- Optional visual avatars for classic authors in feedback toast notifications.
- Capsule queue without currency or tickets.
- Voxel-style 3D placeholders with R3F.
- Capsule and collection 3D surfaces are lazy-loaded so the writing flow does not import R3F/Three upfront.
- TXT export for banked posts.
- IndexedDB editor autosave buffer with localStorage fallback.
- Static-first boot: local/AuthGate UI renders immediately while Supabase hydration runs in the background.
- Banked posts can be reopened in the editor and updated without duplicating season progress or capsules.
- Bank view supports text search and tag chips for navigation.
- Editor supports Telegram-style plain-text formatting for bold, italic, and links.
- Bank preview safely renders supported formatting without HTML injection.
- Dashboard copy is intentionally supportive: daily focus, hidden empty capsule CTA, and no red plan debt unless previous days are missed.
- Playwright E2E smoke tests for local mode, IndexedDB recovery, banking, capsules, collection, and export.
- Search Assist docs and `npm run search:assist -- "pattern"` support LLM navigation through the codebase.
- CODEMAP, TRACEABILITY, BOUNDARIES, REGRESSIONS, HANDOFF, COPY_GUIDE, and COMMIT_CHECKLIST document the LLM-first workflow.
- `npm run verify`, `npm run verify:full`, and `npm run verify:pages` provide repeatable verification commands.
- Prettier, ESLint, architecture boundary checks, advisory size budgets, and Knip reporting are wired into quality scripts.
- Oversized editor/store/style files were split into controller/helper modules and stylesheet slices; `npm run size:check` is clean.
- Knip dead-code reporting is clean after removing accidental public exports and configuring expected binaries.
- GitHub Actions warns when code changes ship without accompanying docs updates.
- GitHub Actions fails architecture-sensitive pushes that do not include an ADR update.
- Conventional Commits are enforced in GitHub Actions on push.

## Key Decisions

- Supabase is the backend because the app needs Auth, RLS, Postgres, and RPC without a custom server.
- GitHub Pages is acceptable because the app is a static SPA and Supabase provides backend services.
- `VITE_BASE_PATH=/Motivation-Blues/` is required for GitHub Pages.
- The editor must be local-first: active writing state is saved to IndexedDB independently from Supabase.
- Cloud hydration must not block first render: Supabase may be slow or unavailable, but the local/static shell should remain usable while cloud sync runs in the background.
- Capsules are queued and opened manually so writing flow is not interrupted.
- Editing a banked post is a content update, not a new banking event; it must not increment counters or create rewards.
- Tag filtering in the bank uses AND semantics when multiple tags are selected.
- Formatting is stored as raw plain text, not WYSIWYG document state.
- Telegram-style markup is not Telegram integration; export/copy remain app-local MVP behavior.
- Unsafe links must render as text, not clickable anchors.
- Large features should start from `Docs/templates/FEATURE_BRIEF.md` under `Docs/features/`.
- Architecture changes affecting storage, backend, auth, deploy, schema, editor safety, or state flow require an ADR.
- CI enforces ADR coverage for architecture-sensitive files through `npm run adr:check`.
- Requirement/test links should be maintained in `Docs/TRACEABILITY.md`.
- `npm run quality` is the default local gate for code changes; `npm run quality:full` adds E2E, Pages build, and dead-code reporting.

## Known Risks

- The lazy 3D chunk is intentionally large; avoid importing R3F/Three from always-loaded views.
- Magic-link redirect must keep the GitHub Pages subpath.
- Supabase RLS must remain strict: users can only access their own rows.
- Autosave changes can accidentally weaken recovery guarantees.
- Supabase Auth/REST requests can stall on startup; the app mitigates this with static-first boot, bounded background refreshes, and a visible retry path.
- GitHub Actions currently forces JavaScript actions to Node 24 to avoid upcoming runner deprecation issues.
- CI now runs unit tests and Playwright E2E before build/deploy.

## Recent History

- Created MVP and Supabase cloud project.
- Deployed to GitHub Pages.
- Added IndexedDB editor autosave buffer.
- Added LLM-first documentation plan.
- Added Playwright E2E tests and fixed local mode reload by waiting for Zustand persist hydration and preserving local mode when no Supabase session exists.
- Added banked-post editing, bank search/tag navigation, Search Assist, and Conventional Commit checks.
- Refined dashboard/editor copy toward a literary-club tone and added Telegram-style formatting with safe bank preview.
- Generated `GEMINI.md` context file, rewrote classic phrases into a structured motivation matrix, and implemented avatar support for Pushkin and Gogol.
- Added cloud hydration timeout/fallback, later superseded at boot by static-first startup so Supabase cannot block first render.
- Hardened LLM-first workflow with code map, traceability, boundary rules, regression log, handoff notes, copy guide, commit checklist, ADR/feature templates, verify scripts, CI docs reminder, and CI ADR enforcement.
- Added code quality automation with Prettier, ESLint, architecture boundary checks, advisory size budgets, Knip report-only dead-code detection, and aggregate quality scripts.
- Lazy-loaded 3D reward screens, split oversized editor/store/style files, and cleaned Knip dead-code findings.
- Updated Vitest to 4.1.8 so full `npm audit` reports 0 vulnerabilities.
- Fixed an autosave readiness race where very fast typing before IndexedDB restore completion could skip the first local buffer write.
- Integrated the Telegram Web App SDK as an MVP to adapt the client for Telegram Mini Apps (TMA).
- Implemented Seamless TMA Auth using a Supabase Edge Function to validate `initData` and auto-login users without email/magic-links.
- Fixed a startup hang issue by adding timeouts to the Telegram auth flow and refactoring the hydration logic to be resilient to concurrent request pre-emption.
- Optimized `App.tsx` auth state listener to avoid redundant hydration calls.
- Fixed Telegram Mini App startup ordering so `AuthGate` mounts and starts `telegram-auth` from the static shell.
- Switched boot to static-first so Supabase hydration no longer blocks the first screen.

## Maintenance Rule

Update this file whenever a change materially affects product behavior, architecture, deployment, database schema, or agent workflow.
