# Tasks

## Recently Completed

### Cloud hydration fail-open
Goal: prevent the startup loader from blocking access when Supabase is slow or unreachable.
Result: initial cloud hydration is bounded by timeout, local data is preserved when present, AuthGate shows retry, and background Supabase refreshes no longer display the fullscreen loader.

### LLM-first workflow hardening
Goal: finish partially implemented LLM-first patterns and make future agent work safer.
Result: added code map, traceability matrix, architecture boundaries, regression log, handoff notes, copy guide, commit checklist, ADR/feature templates, verify scripts, CI docs reminder, and CI ADR enforcement.

## High Priority

### 1. Lazy-load 3D screens
Goal: reduce initial JS bundle size by loading R3F only when capsule or collection screens are opened.
Context: Vite warns that the main chunk is larger than 500 kB because Three/R3F are bundled eagerly.
Files likely involved: `src/App.tsx`, `src/components/CapsuleQueue.tsx`, `src/components/Collection.tsx`, `src/components/VoxelShowcase.tsx`.
Acceptance criteria: dashboard/editor initial route no longer imports R3F synchronously; `npm run build` passes; GitHub Pages build passes.
Verification: compare build chunk output before/after.

### 2. Extend autosave conflict UX to drafts
Goal: if an IndexedDB buffer exists and user selects a different draft, offer a clear choice instead of silently replacing the editor.
Context: banked-post editing now protects unrelated emergency buffers, but draft selection still needs the same explicit choice.
Files likely involved: `src/components/ZenEditor.tsx`, `src/lib/editorBuffer.ts`.
Acceptance criteria: user can keep buffer, load selected draft, or save buffer as draft.
Verification: manual QA in `Docs/MANUAL_QA.md`.

### 3. Add error boundary
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
