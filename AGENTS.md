# AGENTS.md

## Project
Motivation Blues is a static React/Vite app for a 40-day writing challenge: write 100 posts in a private bank, unlock season progress, collect capsules, and keep text safe with local-first autosave.

## Stack
- Frontend: React 18, TypeScript, Vite.
- State: Zustand.
- Backend: Supabase Auth, Postgres, RLS, RPC.
- Local-first safety: IndexedDB editor buffer with localStorage fallback.
- 3D: `@react-three/fiber`, `@react-three/drei`, Three.js.
- Deploy: GitHub Pages via GitHub Actions.

## Must Read Before Changes
1. `Docs/CONTEXT.md`
2. `Docs/PROJECT_MEMORY.md`
3. `Docs/ARCHITECTURE.md`
4. `Docs/TASKS.md`
5. `Docs/CODEMAP.md`
6. `Docs/SEARCH_ASSIST.md` when locating behavior or tests
7. Relevant ADR under `Docs/adr/`

For large feature work, create or update a feature brief under `Docs/features/` before implementation. Use `Docs/templates/FEATURE_BRIEF.md`.

For architecture changes affecting storage, backend, auth, deployment, schema, editor safety, or state flow, add an ADR using `Docs/templates/ADR.md`.

## Commands
```bash
npm test
npm run test:e2e
npm run build
npm run verify
npm run verify:full
npm run verify:pages
npm run adr:check
npm run search:assist -- "pattern"
npm run commitlint:last
npx supabase migration list
```

GitHub Pages build check:
```powershell
$env:VITE_BASE_PATH='/Motivation-Blues/'
npm run build
Remove-Item Env:\VITE_BASE_PATH
```

## Hard Rules
- Do not commit `.env`, `.env.local`, `supabase/.temp/`, `dist/`, or `node_modules/`.
- Do not put Supabase service-role keys in frontend code, docs, or GitHub Actions frontend env.
- Do not edit already-applied Supabase migrations. Add a new migration instead.
- Keep GitHub Pages subpath support: `VITE_BASE_PATH=/Motivation-Blues/`.
- Keep magic-link redirects compatible with `https://llayon.github.io/Motivation-Blues/`.
- Preserve local-first editor safety. Changes to the editor must not weaken IndexedDB autosave/recovery.
- Use Conventional Commits for all new commits, for example `feat: add bank search`.
- Avoid adding AI text-generation features unless the product spec explicitly changes.
- Avoid adding currency, tickets, store, or Telegram integration in MVP scope.
- Respect `Docs/BOUNDARIES.md` when changing state, cloud sync, editor safety, or deployment.

## Definition of Done
- User-visible behavior matches `Docs/PRODUCT_SPEC.md`.
- `npm test` passes.
- `npm run test:e2e` passes for editor/local-mode/core-loop changes.
- `npm run build` passes.
- `npm run verify:pages` passes for deploy, routing, base-path, or magic-link changes.
- Commit messages pass `npm run commitlint:last` after committing.
- Supabase migrations are additive and pushed when DB behavior changes.
- `npm run adr:check` passes for architecture-sensitive changes.
- Update `Docs/PROJECT_MEMORY.md` after significant architecture/product changes.
- Update `Docs/TASKS.md` when completing or adding planned work.
- Update `Docs/TRACEABILITY.md` when requirements, implementation files, or tests change.
- Update `Docs/REGRESSIONS.md` when fixing a regression.
- Use `Docs/COMMIT_CHECKLIST.md` before committing.

## Code Style
- TypeScript strict mode is active.
- Prefer small domain helpers in `src/lib/`.
- Keep UI components direct and readable.
- Keep product constants explicit and documented.
- Use static phrase banks, not LLM calls, for classic feedback.

## Deployment
- Repository: `https://github.com/Llayon/Motivation-Blues`
- Production URL: `https://llayon.github.io/Motivation-Blues/`
- Workflow: `.github/workflows/deploy-pages.yml`
- Supabase project ref: `ryvvthzzlnbejyvlrqup`
