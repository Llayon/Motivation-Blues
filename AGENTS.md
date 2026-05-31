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
5. Relevant ADR under `Docs/adr/`

## Commands
```bash
npm test
npm run build
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
- Avoid adding AI text-generation features unless the product spec explicitly changes.
- Avoid adding currency, tickets, store, or Telegram integration in MVP scope.

## Definition of Done
- User-visible behavior matches `Docs/PRODUCT_SPEC.md`.
- `npm test` passes.
- `npm run build` passes.
- GitHub Pages base-path build passes for deploy-affecting changes.
- Supabase migrations are additive and pushed when DB behavior changes.
- Update `Docs/PROJECT_MEMORY.md` after significant architecture/product changes.
- Update `Docs/TASKS.md` when completing or adding planned work.

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
