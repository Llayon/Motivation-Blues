# Code Map

Use this file as the first map before broad code search. It points an LLM agent to the smallest useful set of files for each behavior.

## App Entry And Routing

- `src/main.tsx`: React root.
- `src/App.tsx`: static-first boot, background Supabase hydration, outbox status/retry lifecycle, auth gate, active view switch, hidden diagnostics route, lazy product routes, and route error boundary/diagnostics context wiring.
- `src/components/Nav.tsx`: main navigation between dashboard, editor, bank, season, capsules, collection, export, and compact outbox sync status.
- `src/components/ErrorBoundary.tsx`: route-level render/lifecycle crash fallback for active views plus copyable local crash report UI.
- `src/lib/crashReport.ts`: typed local-only crash report creation, localStorage persistence, formatting, and clipboard copy.
- `src/components/DiagnosticsHub.tsx`: hidden manual support screen for `?debug=1`.
- `src/lib/diagnostics.ts`: privacy-safe support snapshot creation and formatting.

## Global State And Product Loop

- `src/store/useAppStore.ts`: central Zustand store for mode, profile, posts, daily progress, capsules, inventory, feedback, local actions, outbox orchestration, and RPC orchestration.
- `src/store/cloudData.ts`: Supabase profile/post/progress/capsule/inventory loading and post persistence mapping.
- `src/store/localPostState.ts`: optimistic local draft/bank/post/progress/capsule state builders.
- `src/store/syncReplay.ts`: replay of queued cloud write operations against Supabase.
- `src/types.ts`: shared product types.
- `src/lib/season.ts`: 40-day schedule, daily goals, season days, levels, milestones.
- `src/lib/random.ts`: random item and rarity helpers.

## Supabase And Cloud Boot

- `src/services/supabase.ts`: Supabase client setup.
- `src/store/cloudData.ts`: cloud data loading and post writes.
- `src/store/useAppStore.ts`: cloud hydration orchestration, outbox runner, and RPC calls.
- `src/lib/cloudHydration.ts`: bounded timeout for background cloud hydration and explicit retry flows.
- `src/lib/syncOutbox.ts`: public cloud-write outbox API and status transitions.
- `src/lib/syncOutboxStorage.ts`: IndexedDB/localStorage outbox persistence.
- `src/lib/syncOutbox.test.ts`: outbox fallback queue and state transition tests.
- `supabase/migrations/`: schema, RLS, RPC definitions.
- `Docs/DATA_CONTRACTS.md`: table and RPC contracts.

## PWA-Lite

- `index.html`: manifest, theme color, and app entry links.
- `public/manifest.webmanifest`: installability metadata and icons.
- `public/sw.js`: app shell/static asset cache; same-origin only.
- `public/icons/`: installable and maskable icon assets.
- `src/lib/registerServiceWorker.ts`: production service worker registration and current-page asset reporting.
- `src/lib/registerServiceWorker.test.ts`: unit checks for cacheable asset collection.
- `Docs/adr/0010-pwa-lite-app-shell-cache.md`: accepted PWA-lite boundary.

## Telegram Mini App

- `index.html`: static document shell; it must not include blocking third-party startup scripts.
- `src/lib/telegramApp.ts`: Telegram launch detection, dynamic SDK loading, `ready()`, `expand()`, and optional fullscreen request.
- `src/main.tsx`: starts non-blocking Telegram environment initialization while rendering React.
- `src/App.tsx`: never blocks first render on root Supabase hydration, so Telegram auto-login can start from `AuthGate`.
- `src/components/AuthGate.tsx`: starts Telegram auto-login from `window.Telegram.WebApp.initData`.
- `src/store/useAppStore.ts`: `startTelegramSession` Edge Function/auth flow.
- `supabase/functions/telegram-auth/index.ts`: validates Telegram `initData` and returns Supabase credentials.
- `Docs/adr/0007-seamless-telegram-auth.md`: accepted TMA auth decision.

## Local-First Editor Safety

- `src/components/ZenEditor.tsx`: editor render shell.
- `src/components/editor/useZenEditorController.ts`: editor state, local-first autosave, formatting command, and conflict UX.
- `src/components/editor/`: draft rail, conflict banner, formatting menu, and footer subcomponents.
- `src/lib/editorBuffer.ts`: IndexedDB autosave buffer with localStorage fallback.
- `src/lib/editorText.ts`: editor text/tag/status helpers.
- `src/store/useAppStore.ts`: draft, bank, banked-edit, and editor target actions.
- `Docs/adr/0003-indexeddb-autosave.md`: accepted autosave decision.
- `tests/e2e/local-writing-flow.spec.ts`: autosave and conflict E2E coverage.

## Local-First Cloud Outbox

- `src/lib/syncOutbox.ts`: durable pending cloud write operations and status transitions.
- `src/lib/syncOutboxStorage.ts`: IndexedDB/localStorage persistence for pending operations.
- `src/store/useAppStore.ts`: queue-on-failure orchestration for draft, bank, banked update, and archive.
- `src/store/localPostState.ts`: local optimistic state for failed cloud writes.
- `src/store/syncReplay.ts`: Supabase replay logic for queued operations.
- `src/store/cloudData.ts`: stable-id Supabase post `upsert` for replay.
- `src/App.tsx`: status refresh and browser `online` retry.
- `src/components/Nav.tsx`: visible waiting/syncing/retry pill.
- `Docs/adr/0011-local-first-sync-outbox.md`: accepted outbox boundary and conflict scope.

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
- `tests/e2e/local-writing-flow.spec.ts`: local-mode, autosave, diagnostics hub, route error boundary/crash report, formatting, banking, capsules, tags, export, and cloud fallback smoke tests.
- `playwright.config.ts`: E2E web server and browser config.
- `playwright.prod.config.ts`: published GitHub Pages smoke config without a local web server.
- `tests/prod-smoke/production.spec.ts`: unauthenticated production URL smoke for app shell, static assets, Telegram SDK gating, and Diagnostics Hub sanitization.

## Quality Automation

- `eslint.config.js`: ESLint flat config for TypeScript, React Hooks, a11y, and import hygiene.
- `.prettierrc`: Prettier formatting rules.
- `scripts/architecture-check.mjs`: import boundary enforcement.
- `scripts/size-budget-check.mjs`: advisory file-size budget report.
- `knip.json`: Knip dead-code entry/project configuration.
- `package.json`: aggregate `quality` and `quality:full` scripts.
- `src/styles.css`: imports split global styles from `src/styles/`.
- `.github/workflows/deploy-pages.yml`: CI build/deploy plus post-deploy production smoke.

## LLM-First Docs

- `AGENTS.md`: mandatory agent rules and definition of done.
- `Docs/SEARCH_ASSIST.md`: targeted search recipes.
- `Docs/TRACEABILITY.md`: requirement-to-test map.
- `Docs/BOUNDARIES.md`: architecture boundaries an agent should not cross.
- `Docs/REGRESSIONS.md`: fixed bugs and the tests that protect them.
- `Docs/HANDOFF.md`: current handoff state for future sessions.
- `Docs/COPY_GUIDE.md`: product copy tone and examples.
- `Docs/COMMIT_CHECKLIST.md`: pre-commit and pre-push checklist.
- `Docs/PRODUCTION_SMOKE.md`: manual and automated published-URL smoke checklist.
