# ADR 0005: Code Quality Automation

## Status

Accepted.

## Decision

Add a layered code quality gate for LLM-first development: Prettier, ESLint, architecture boundary checks, advisory size budgets, Knip dead-code reporting, and aggregate `quality` scripts.

## Context

The project is developed primarily through LLM-assisted changes. LLM output benefits from fast, deterministic feedback because style drift, accidental boundary violations, dead code, and oversized files are otherwise easy to miss. The app already has unit/E2E tests, ADR enforcement, and documentation workflows; code quality checks should become part of the same automated loop.

## Consequences

- Formatting is delegated to Prettier instead of manual or conversational style decisions.
- ESLint catches common TypeScript, React Hooks, a11y, and import hygiene issues.
- `architecture:check` encodes key rules from `Docs/BOUNDARIES.md`.
- `size:check` starts as advisory because `useAppStore.ts`, `ZenEditor.tsx`, and `styles.css` already exceed desired budgets.
- `deadcode` uses Knip in non-failing mode until false positives and entry points are tuned.
- CI runs the hard quality checks before unit/E2E/build/deploy.

## Verification

- `npm run format:check`
- `npm run lint`
- `npm run architecture:check`
- `npm run size:check`
- `npm run deadcode`
- `npm run quality`
- `npm run quality:full`
