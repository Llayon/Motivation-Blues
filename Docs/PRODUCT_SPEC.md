# Product Spec

## Summary

Motivation Blues is a 40-day writing challenge editor. The user writes 100 ready posts in a private bank and gets gentle gamified feedback without publishing pressure.

## Core Goal

- Target: 100 banked posts.
- Duration: 40 days.
- Progress only counts posts explicitly saved to the bank.
- Drafts and active editor buffer do not count.

## Landing

- H1: `100 постов за 40 дней. Пиши для себя.`
- H2: `Дзен-редактор, который лечит писательский блок. Пиши «в стол», закрывай дневную норму и собирай уникальные награды за каждую победу над чистым листом.`
- Email input copy: `Твой лучший email`.
- Primary CTA: `Начать марафон`.
- Secondary CTA: `Вернуться к текстам`.

## Daily Schedule

- Days 1-10: 2 posts per day.
- Days 11-30: 3 posts per day.
- Days 31-40: 2 posts per day.
- Total planned posts: 100.

## Post Statuses

- `draft`: saved but not counted toward the season.
- `banked`: ready post, counted toward the 100-post goal.
- `archived`: hidden from the main ready-bank flow.

## Editor

- Minimal text editor with title, content, tags, character count, and word count.
- Active editor state is local-first and autosaved to IndexedDB.
- User can save as draft or save to bank.
- Saving to bank is explicit and should not happen automatically.
- User can reopen a banked post for editing.
- Updating a banked post keeps the same post and must not add progress, capsules, or classic feedback as if it were newly banked.
- If a banked edit or draft switch would collide with an unrelated emergency buffer, the UI must ask before replacing local text.
- Editor copy should feel like a cozy, lightly ironic literary club rather than a generic productivity tool.
- Draft save CTA copy is `Убрать в стол`; bank CTA copy is `Отправить в банк`.

## Formatting

- Content remains plain text.
- Supported Telegram-style markup: `*жирный*`, `_курсив_`, `[текст](https://example.com)`.
- Formatting controls appear as a small floating menu when text is selected in the editor.
- Export keeps raw markup exactly as stored.
- Bank cards may render supported markup as preview UI, but storage must remain raw text.
- Unsafe links such as `javascript:` must not become clickable.

## Bank

- Shows only banked posts.
- Supports text search across title, content, and tags.
- Supports tag chips for navigation.
- Multiple selected tags narrow results using AND semantics.
- Bank preview safely renders supported Telegram-style markup without using HTML injection.

## Dashboard

- Main daily status should be supportive and premium, not punitive.
- Capsule button is hidden when there are no sealed capsules.
- Overdue/red plan copy appears only for missed previous days, not for day 1 or normal progress.

## Season Pass

- 20 levels.
- 5 banked posts per level.
- Main progress is posts, not XP.
- Season Pass should make progress visible without distracting from writing.

## Capsules

- No currency.
- No tickets.
- No shop.
- Capsules are sealed reward objects created by events.
- User opens capsules manually in the capsule screen.
- Opening a capsule produces a collectible item.

## Capsule Triggers

- First time the user meets the current day goal.
- Milestones: 10, 25, 50, 75, 100 banked posts.

## Classic Feedback

- No AI.
- Static TypeScript phrase bank.
- Phrase appears as a soft non-modal toast after saving a post to the bank.
- Tone is playful and encouraging.

## Collection

- Collectible items are voxel-style figurines of Russian literary classics.
- Rarities: `common`, `rare`, `epic`, `legendary`.
- Duplicate items are allowed and shown as counts.

## Export

- User can export only banked posts.
- Export format is `.txt` with separators.
- Drafts are not exported.

## Out Of Scope For MVP

- Telegram integration.
- AI writing assistance.
- AI review.
- Currency or monetization.
- Social features.
- Public profiles.
- WYSIWYG rich text editing.
