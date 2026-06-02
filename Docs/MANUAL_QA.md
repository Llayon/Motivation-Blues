# Manual QA Checklist

## Before QA
- Run `npm run verify`.
- Run `npm run test:e2e` for editor, local-mode, core-loop, formatting, auth, or navigation changes.
- For deploy changes, run `npm run verify:pages`.
- For large releases, run `npm run verify:full`.

## Editor
- Open editor.
- Type a title, body, and tags.
- Confirm autosave status updates.
- Select text and apply bold, italic, and link formatting.
- Confirm textarea stores raw markup: `*text*`, `_text_`, `[text](https://example.com)`.
- Reload page.
- Confirm text restores.
- Click `Новый`.
- Confirm editor clears and stale buffer does not restore.

## Drafts
- Save text as draft.
- Reload.
- Confirm draft appears in rail.
- Load draft.
- Edit draft.
- Save again.

## Bank
- Save a post to bank.
- Confirm classic toast appears.
- Confirm editor clears.
- Confirm bank count increases.
- Confirm supported formatting renders in bank cards.
- Confirm unsafe links are not clickable.
- Reopen the banked post with `Редактировать`.
- Update title, content, and tags.
- Confirm the post updates without increasing progress or creating a new capsule.
- Search by title/body text.
- Filter by one tag chip and then by two tag chips.
- Confirm exported text includes the post.
- Confirm exported text keeps raw Telegram-style markup.

## Capsules
- Bank enough posts to meet daily goal.
- Confirm capsule appears but does not interrupt editor.
- Open capsule manually.
- Confirm item appears in collection.

## Auth
- Request magic link locally.
- Request magic link on GitHub Pages.
- Confirm redirect lands inside the app path.
- Simulate unavailable Supabase or disable network.
- Confirm the startup loader exits and AuthGate remains usable.
- Click `Вернуться к текстам`.
- Confirm local dashboard opens and writing can continue.

## Landing
- Confirm H1, H2, email input, primary CTA, and secondary CTA match `Docs/PRODUCT_SPEC.md`.
- Confirm the page feels like a premium writing room, not a generic SaaS landing.

## Dashboard
- Confirm daily focus copy is supportive.
- Confirm red missed-plan copy appears only for missed previous days.
- Confirm empty capsule CTA is hidden when there are no sealed capsules.

## Export
- Export banked posts.
- Confirm drafts are not exported.
- Confirm raw formatting markup is preserved.

## LLM Workflow
- For large features, confirm a brief exists under `Docs/features/`.
- For architecture changes, confirm an ADR exists or no ADR is needed.
- Confirm `Docs/TRACEABILITY.md` references new requirements or tests.
- Confirm `Docs/REGRESSIONS.md` is updated after bug fixes.
- Confirm `Docs/HANDOFF.md` reflects current risks and next tasks.

## Responsive
- Check desktop width.
- Check mobile width.
- Confirm editor remains usable.
