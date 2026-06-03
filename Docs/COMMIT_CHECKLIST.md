# Commit Checklist

Use this before committing or pushing changes.

## Before Commit

- `git status --short` shows only intended files.
- User changes are not reverted or overwritten.
- No `.env`, `.env.local`, `dist/`, `node_modules/`, or `supabase/.temp/` files are staged.
- No Supabase service-role keys appear in code, docs, or workflow env.
- Applied Supabase migrations were not edited.
- Product scope still avoids AI generation, currency, tickets, shop, and Telegram publishing/channel sync unless the spec changed.

## Verification

- Run `npm run quality` for normal code and workflow changes.
- Run `npm test` for unit-covered helper or logic changes.
- Run `npm run build` for TypeScript/build validation.
- Run `npm run test:e2e` for editor, local mode, core loop, formatting, auth, or navigation changes.
- Run `npm run verify:pages` for deploy, routing, base-path, magic-link redirect, or workflow changes.
- Run `npm run adr:check` for architecture-sensitive changes.
- Run `npm run deadcode` before cleanup/refactor work to see Knip findings.
- Run `npm run verify:full` before substantial releases when time allows.

## Documentation

- Update `Docs/PROJECT_MEMORY.md` for significant behavior, architecture, deployment, database, or workflow changes.
- Update `Docs/TASKS.md` when completing or adding planned work.
- Update `Docs/TRACEABILITY.md` when requirements or tests change.
- Add or update ADRs when storage, backend, deploy, auth, schema, editor safety, or state architecture changes.
- CI enforces ADR updates for architecture-sensitive files through `npm run adr:check`.
- Update `Docs/TASKS.md` if `size:check` or Knip findings create follow-up work.
- Add a regression entry when fixing a bug that could recur.

## Commit

- Use Conventional Commits, for example `feat: add bank search`.
- After committing, run `npm run commitlint:last`.
