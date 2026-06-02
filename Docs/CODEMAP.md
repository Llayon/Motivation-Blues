# Code Map

Use this file as the first map before broad code search. It points an LLM agent to the smallest useful set of files for each behavior.

## App Entry And Routing

- `src/main.tsx`: React root.
- `src/App.tsx`: top-level hydration, auth gate, active view switch, and lazy 3D reward routes.
- `src/components/Nav.tsx`: main navigation between dashboard, editor, bank, season, capsules, collection, and export.

## Global State And Product Loop

- `src/store/useAppStore.ts`: central Zustand store for mode, profile, posts, daily progress, capsules, inventory, feedback, local actions, and RPC orchestration.
- `src/store/cloudData.ts`: Supabase profile/post/progress/capsule/inventory loading and post persistence mapping.
- `src/types.ts`: shared product types.
- `src/lib/season.ts`: 40-day schedule, daily goals, season days, levels, milestones.
- `src/lib/random.ts`: random item and rarity helpers.

## Supabase And Cloud Boot

- `src/services/supabase.ts`: Supabase client setup.
- `src/store/cloudData.ts`: cloud data loading and post writes.
- `src/store/useAppStore.ts`: cloud hydration orchestration and RPC calls.
- `src/lib/cloudHydration.ts`: bounded cloud hydration timeout.
- `supabase/migrations/`: schema, RLS, RPC definitions.
- `Docs/DATA_CONTRACTS.md`: table and RPC contracts.

## Local-First Editor Safety

- `src/components/ZenEditor.tsx`: editor render shell.
- `src/components/editor/useZenEditorController.ts`: editor state, local-first autosave, formatting command, and conflict UX.
- `src/components/editor/`: draft rail, conflict banner, formatting menu, and footer subcomponents.
- `src/lib/editorBuffer.ts`: IndexedDB autosave buffer with localStorage fallback.
- `src/lib/editorText.ts`: editor text/tag/status helpers.
- `src/store/useAppStore.ts`: draft, bank, banked-edit, and editor target actions.
- `Docs/adr/0003-indexeddb-autosave.md`: accepted autosave decision.
- `tests/e2e/local-writing-flow.spec.ts`: autosave and conflict E2E coverage.

## Formatting

- `src/lib/telegramFormatting.ts`: plain-text formatting and safe parsing helpers.
- `src/components/TelegramMarkup.tsx`: safe preview renderer without `dangerouslySetInnerHTML`.
- `src/components/editor/EditorFormattingMenu.tsx`: floating formatting controls.
- `src/lib/telegramFormatting.test.ts`: unit tests.
- `tests/e2e/local-writing-flow.spec.ts`: formatting E2E test.

## Bank, Search, Tags, And Export

- `src/components/Bank.tsx`: banked-post list, edit actions, search UI, tag chips.
- `src/lib/bankFilters.ts`: search and AND tag filtering.
- `src/lib/exportPosts.ts`: TXT export formatting.
- `src/store/useAppStore.ts`: `updateBankedPost`, `archivePost`, and bank state.
- `src/lib/bankFilters.test.ts`: bank filtering unit tests.

## Dashboard And Season Progress

- `src/components/Dashboard.tsx`: main daily status, cards, capsule CTA visibility.
- `src/components/SeasonPass.tsx`: level/progress visualization.
- `src/lib/season.ts`: season constants and calculations.
- `src/lib/season.test.ts`: season unit tests.

## Capsules And Collection

- `src/components/CapsuleQueue.tsx`: sealed capsule queue and manual opening.
- `src/components/Collection.tsx`: owned collectibles.
- `src/components/VoxelShowcase.tsx`: procedural voxel-style 3D placeholders.
- `src/App.tsx`: lazy-load boundary for capsule and collection screens.
- `src/data/items.ts`: collectible catalog.
- `src/store/useAppStore.ts`: local/cloud capsule opening.

## Classic Feedback

- `src/data/classicPhrases.ts`: static phrase bank and persona logic. No LLM calls.
- `src/components/ClassicToast.tsx`: non-modal feedback toast.

## Tests

- `src/lib/*.test.ts`: unit coverage for pure helpers.
- `tests/e2e/local-writing-flow.spec.ts`: local-mode, autosave, formatting, banking, capsules, tags, export, and cloud fallback smoke tests.
- `playwright.config.ts`: E2E web server and browser config.

## Quality Automation

- `eslint.config.js`: ESLint flat config for TypeScript, React Hooks, a11y, and import hygiene.
- `.prettierrc`: Prettier formatting rules.
- `scripts/architecture-check.mjs`: import boundary enforcement.
- `scripts/size-budget-check.mjs`: advisory file-size budget report.
- `knip.json`: Knip dead-code entry/project configuration.
- `package.json`: aggregate `quality` and `quality:full` scripts.
- `src/styles.css`: imports split global styles from `src/styles/`.

## LLM-First Docs

- `AGENTS.md`: mandatory agent rules and definition of done.
- `Docs/SEARCH_ASSIST.md`: targeted search recipes.
- `Docs/TRACEABILITY.md`: requirement-to-test map.
- `Docs/BOUNDARIES.md`: architecture boundaries an agent should not cross.
- `Docs/REGRESSIONS.md`: fixed bugs and the tests that protect them.
- `Docs/HANDOFF.md`: current handoff state for future sessions.
- `Docs/COPY_GUIDE.md`: product copy tone and examples.
- `Docs/COMMIT_CHECKLIST.md`: pre-commit and pre-push checklist.
