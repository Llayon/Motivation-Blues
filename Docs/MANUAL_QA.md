# Manual QA Checklist

## Before QA
- Run `npm test`.
- Run `npm run build`.
- For deploy changes, run GitHub Pages base-path build.

## Editor
- Open editor.
- Type a title, body, and tags.
- Confirm autosave status updates.
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
- Confirm exported text includes the post.

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
