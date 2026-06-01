# Project Memory

## Current State
- MVP app implemented with React, TypeScript, Vite, Zustand, Supabase, R3F, and GitHub Pages.
- Supabase project `Motivation blues` exists in region `eu-central-1`.
- GitHub repository exists at `https://github.com/Llayon/Motivation-Blues`.
- Production URL is `https://llayon.github.io/Motivation-Blues/`.
- GitHub Pages deploy runs through `.github/workflows/deploy-pages.yml`.

## Implemented Features
- Supabase Auth magic-link flow.
- Cloud-backed posts, progress, capsules, and inventory.
- Local fallback mode for browser-only sessions.
- 40-day season with 100 banked posts.
- Daily goals: days 1-10 = 2 posts, days 11-30 = 3 posts, days 31-40 = 2 posts.
- 20-level Season Pass, 5 posts per level.
- Static classic feedback phrases, no AI.
- Capsule queue without currency or tickets.
- Voxel-style 3D placeholders with R3F.
- TXT export for banked posts.
- IndexedDB editor autosave buffer with localStorage fallback.
- Banked posts can be reopened in the editor and updated without duplicating season progress or capsules.
- Bank view supports text search and tag chips for navigation.
- Editor supports Telegram-style plain-text formatting for bold, italic, and links.
- Bank preview safely renders supported formatting without HTML injection.
- Dashboard copy is intentionally supportive: daily focus, hidden empty capsule CTA, and no red plan debt unless previous days are missed.
- Playwright E2E smoke tests for local mode, IndexedDB recovery, banking, capsules, collection, and export.
- Search Assist docs and `npm run search:assist -- "pattern"` support LLM navigation through the codebase.
- Conventional Commits are enforced in GitHub Actions on push.

## Key Decisions
- Supabase is the backend because the app needs Auth, RLS, Postgres, and RPC without a custom server.
- GitHub Pages is acceptable because the app is a static SPA and Supabase provides backend services.
- `VITE_BASE_PATH=/Motivation-Blues/` is required for GitHub Pages.
- The editor must be local-first: active writing state is saved to IndexedDB independently from Supabase.
- Capsules are queued and opened manually so writing flow is not interrupted.
- Editing a banked post is a content update, not a new banking event; it must not increment counters or create rewards.
- Tag filtering in the bank uses AND semantics when multiple tags are selected.
- Formatting is stored as raw plain text, not WYSIWYG document state.
- Telegram-style markup is not Telegram integration; export/copy remain app-local MVP behavior.
- Unsafe links must render as text, not clickable anchors.

## Known Risks
- Three/R3F is bundled eagerly and creates a large JS chunk.
- Magic-link redirect must keep the GitHub Pages subpath.
- Supabase RLS must remain strict: users can only access their own rows.
- Autosave changes can accidentally weaken recovery guarantees.
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

## Maintenance Rule
Update this file whenever a change materially affects product behavior, architecture, deployment, database schema, or agent workflow.
