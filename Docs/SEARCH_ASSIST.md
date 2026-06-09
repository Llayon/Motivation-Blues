# Search Assist

Use this file after `Docs/CODEMAP.md` when an LLM agent needs to locate behavior quickly without broad, noisy reads.

## First Step

Read `Docs/CODEMAP.md` to identify the likely feature area, then use the focused commands below.

## Command

```bash
npm run search:assist -- "pattern"
```

The script wraps `rg --line-number --hidden` and skips generated or local-only directories such as `node_modules`, `dist`, `coverage`, and `supabase/.temp`.

## Product Rules

```bash
npm run search:assist -- "No AI|currency|tickets|Telegram"
npm run search:assist -- "Capsules|Season Pass|banked posts"
```

High-signal docs:

- `Docs/PRODUCT_SPEC.md`
- `Docs/PROJECT_MEMORY.md`
- `Docs/CONTEXT.md`
- `Docs/CODEMAP.md`
- `Docs/TRACEABILITY.md`
- `Docs/BOUNDARIES.md`
- `Docs/adr/`

## Editor And Autosave

```bash
npm run search:assist -- "ZenEditor|editorTargetPostId|openPostInEditor"
npm run search:assist -- "IndexedDB|editorBuffer|active-editor-buffers"
```

High-signal files:

- `src/components/ZenEditor.tsx`
- `src/lib/editorBuffer.ts`
- `src/store/useAppStore.ts`
- `tests/e2e/local-writing-flow.spec.ts`

## Bank, Tags, And Export

```bash
npm run search:assist -- "updateBankedPost|bankPost|filterBankedPosts"
npm run search:assist -- "tag-filter|bank-search|export"
```

High-signal files:

- `src/components/Bank.tsx`
- `src/lib/bankFilters.ts`
- `src/lib/exportPosts.ts`
- `src/store/useAppStore.ts`

## Supabase

```bash
npm run search:assist -- "bank_post|open_capsule|RLS"
npm run search:assist -- "saveCloudPost|hydrateFromSupabase"
```

High-signal files:

- `Docs/DATA_CONTRACTS.md`
- `supabase/migrations/`
- `src/services/supabase.ts`
- `src/store/useAppStore.ts`

## Cloud Outbox

```bash
npm run search:assist -- "syncOutbox|enqueueSyncOperation|listReplayableSyncOperations"
npm run search:assist -- "Ждет облако|Повторить облако|sync-status"
```

High-signal files:

- `src/lib/syncOutbox.ts`
- `src/lib/syncOutboxStorage.ts`
- `src/store/useAppStore.ts`
- `src/store/localPostState.ts`
- `src/store/syncReplay.ts`
- `src/store/cloudData.ts`
- `src/components/Nav.tsx`
- `Docs/adr/0011-local-first-sync-outbox.md`

## Route Error Boundary And Crash Reports

```bash
npm run search:assist -- "ErrorBoundary|crashReport|__simulateRouteError|Скопировать отчет"
```

High-signal files:

- `src/components/ErrorBoundary.tsx`
- `src/lib/crashReport.ts`
- `src/App.tsx`
- `tests/e2e/local-writing-flow.spec.ts`
- `Docs/adr/0012-route-error-boundary.md`
- `Docs/adr/0013-production-crash-report.md`

## Manual Diagnostics Hub

```bash
npm run search:assist -- "DiagnosticsHub|createDiagnosticsSnapshot|debug=1|Скопировать диагностику"
```

High-signal files:

- `src/components/DiagnosticsHub.tsx`
- `src/lib/diagnostics.ts`
- `src/App.tsx`
- `tests/e2e/local-writing-flow.spec.ts`
- `Docs/adr/0014-manual-diagnostics-hub.md`

## Production Smoke

```bash
npm run search:assist -- "test:prod-smoke|playwright.prod|PROD_SMOKE_BASE_URL|production-smoke"
```

High-signal files:

- `playwright.prod.config.ts`
- `tests/prod-smoke/production.spec.ts`
- `.github/workflows/deploy-pages.yml`
- `Docs/PRODUCTION_SMOKE.md`
- `Docs/adr/0015-production-smoke-after-pages-deploy.md`

## Tests

```bash
npm run search:assist -- "test\\(|describe\\("
npm run search:assist -- "data-testid"
```

Default verification for code changes:

- `npm test`
- `npm run test:e2e` for editor/local-mode/core-loop changes
- `npm run build`
- `npm run verify:pages` for deploy/base-path changes
- `npm run test:prod-smoke` for post-deploy production URL checks when network is available
