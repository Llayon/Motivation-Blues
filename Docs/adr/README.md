# ADR Workflow

Architecture Decision Records document decisions that future LLM sessions must not rediscover from scratch.

## When To Add An ADR
Add an ADR when a change affects:
- Storage or local-first safety.
- Supabase schema, RLS, RPC, auth, or cloud sync behavior.
- Deployment, routing, GitHub Pages base path, or magic-link redirects.
- State architecture or cross-component data flow.
- Editor document model or autosave semantics.
- Major rendering or asset pipeline decisions.

## Naming
Use the next sequential number:

```text
0004-short-topic.md
```

## Template
Use `Docs/templates/ADR.md`.

## Status Values
- `Proposed`
- `Accepted`
- `Superseded`
- `Rejected`

## Rule
Do not rewrite accepted ADR history to hide a change. Add a new ADR when the decision changes.

## CI Enforcement
`npm run adr:check` fails when architecture-sensitive files change without an ADR update under `Docs/adr/`.

The enforced sensitive areas include:
- `.github/workflows/`
- `scripts/`
- `supabase/`
- `src/App.tsx`
- `src/main.tsx`
- `src/services/`
- `src/store/`
- `src/lib/editorBuffer*`
- `src/lib/cloudHydration*`
- `src/types.ts`
- `vite.config*`
- `playwright.config*`
- architecture, boundary, data contract, release playbook, and ADR template docs.
