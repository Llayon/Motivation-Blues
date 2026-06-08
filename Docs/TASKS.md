# Tasks

## Recently Completed

### Cloud hydration fail-open

Goal: prevent cloud startup from blocking access when Supabase is slow or unreachable.
Result: initial cloud hydration is bounded by timeout, local data is preserved when present, AuthGate shows retry, background Supabase refreshes no longer display the fullscreen loader, and static-first boot renders before cloud hydration.

### LLM-first workflow hardening

Goal: finish partially implemented LLM-first patterns and make future agent work safer.
Result: added code map, traceability matrix, architecture boundaries, regression log, handoff notes, copy guide, commit checklist, ADR/feature templates, verify scripts, CI docs reminder, and CI ADR enforcement.

### Code quality automation

Goal: add machine-checkable quality gates for LLM-first development.
Result: added Prettier, ESLint, architecture boundary check, advisory size budgets, Knip report-only dead-code detection, aggregate quality scripts, and CI quality steps.

### 3D lazy-loading and size/dead-code cleanup

Goal: finish code-quality follow-ups after introducing LLM-first gates.
Result: capsule/collection screens now lazy-load their 3D chunks, editor/store/style files were split below size budgets, and Knip dead-code findings were resolved.

### Startup performance pass

Goal: keep the static/start shell independent from third-party SDKs and non-current product screens.
Result: Telegram SDK is loaded dynamically only for Telegram launch URLs, normal browser startup does not request it, and product route components lazy-load from `App`.

### PWA-lite installability

Goal: make the app installable and keep the static writing room available from cache on repeat visits.
Result: added manifest, icons, service worker app-shell cache, production registration, and PWA smoke tests. Offline cloud sync remains out of scope.

### Local-first sync outbox

Goal: let cloud-mode user actions be recorded locally when Supabase is offline or slow and replayed safely later.
Result: added IndexedDB/localStorage outbox, queue-on-failure for draft/bank/update/archive, stable-id Supabase post upsert, runtime replay on hydration/online, nav sync status, feature brief, ADR, and unit tests.

## High Priority

### 1. Extend autosave conflict UX to drafts

Goal: if an IndexedDB buffer exists and user selects a different draft, offer a clear choice instead of silently replacing the editor.
Context: banked-post editing now protects unrelated emergency buffers, but draft selection still needs the same explicit choice.
Files likely involved: `src/components/ZenEditor.tsx`, `src/lib/editorBuffer.ts`.
Acceptance criteria: user can keep buffer, load selected draft, or save buffer as draft.
Verification: manual QA in `Docs/MANUAL_QA.md`.

### 2. Add error boundary

Goal: avoid blank page on runtime UI errors.
Context: production is a static SPA on GitHub Pages.
Files likely involved: `src/App.tsx`, new `src/components/ErrorBoundary.tsx`.
Acceptance criteria: app shows a readable fallback and does not lose active editor buffer.
Verification: build passes and manual injected error test.

## Medium Priority

### 4. Add Supabase contract tests

Goal: automate RLS and RPC checks for user ownership, `bank_post`, and `open_capsule`.
Context: `Docs/TRACEABILITY.md` currently marks Supabase contract tests as planned.
Acceptance criteria: tests prove own-row access, foreign-row rejection, idempotent banking, and sealed-capsule validation.

### 5. Add visual regression smoke tests

Goal: catch major layout/copy regressions on landing, dashboard, editor, bank, and capsules.
Context: UI/copy QA is documented but still manual.
Acceptance criteria: screenshot or structured Playwright checks run in CI without making tests brittle.

### 6. Improve collection visuals

Goal: make figurines feel more like glossy collectible toys.
Context: current models are procedural placeholders.
Acceptance criteria: no runtime material mutation of imported assets unless intentional.

## Low Priority

### 7. Add richer phrase library

Goal: expand static classic feedback variety without adding AI.
Acceptance criteria: phrase bank remains static and typed.

### 8. Add theme polish

Goal: refine light glassmorphism system and responsive layout.
Acceptance criteria: mobile editor remains usable.
