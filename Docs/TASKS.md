# Tasks

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

### 4. Add release checklist automation
Goal: make deploy verification repeatable.
Context: current release checks are manual CLI commands.
Acceptance criteria: a script or workflow validates build, test, and Pages URL status.

### 5. Improve collection visuals
Goal: make figurines feel more like glossy collectible toys.
Context: current models are procedural placeholders.
Acceptance criteria: no runtime material mutation of imported assets unless intentional.

## Low Priority

### 6. Add richer phrase library
Goal: expand static classic feedback variety without adding AI.
Acceptance criteria: phrase bank remains static and typed.

### 7. Add theme polish
Goal: refine light glassmorphism system and responsive layout.
Acceptance criteria: mobile editor remains usable.
