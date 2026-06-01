# Manual QA Checklist

## Before QA
- Run `npm test`.
- Run `npm run test:e2e`.
- Run `npm run build`.
- For deploy changes, run GitHub Pages base-path build.

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

## Responsive
- Check desktop width.
- Check mobile width.
- Confirm editor remains usable.
