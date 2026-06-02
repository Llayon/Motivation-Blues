# ADR 0004: LLM-First Workflow Enforcement

## Status

Accepted.

## Decision

Enforce the LLM-first architecture workflow in CI with a hard ADR check for architecture-sensitive changes, plus a non-blocking docs freshness reminder.

## Context

The project is developed primarily through LLM-assisted sessions. Documentation existed, but some patterns were only process rules: feature briefs, traceability, ADR updates, commit checklist usage, and release verification. Without automation, future sessions could change state, deployment, Supabase, editor safety, or scripts without recording the architectural decision.

## Consequences

- Architecture-sensitive changes must include an ADR update under `Docs/adr/`.
- CI now fails if sensitive files change without ADR coverage.
- Documentation freshness remains a warning so small code/docs mismatches do not block emergency fixes.
- Agents have a clearer workflow through `AGENTS.md`, `Docs/CODEMAP.md`, `Docs/TRACEABILITY.md`, `Docs/BOUNDARIES.md`, and `Docs/COMMIT_CHECKLIST.md`.

## Verification

- `npm run adr:check`
- `npm run docs:changed-check`
- `npm run verify:full`
