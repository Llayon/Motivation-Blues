# Project Context

Motivation Blues is a light, gamified writing editor for beginner bloggers. The product helps a user write 100 ready posts in 40 days before publishing anywhere.

## Product Loop
1. User opens the Zen editor.
2. User writes a post in the app.
3. Every keystroke is saved locally to IndexedDB.
4. User explicitly saves the text as a draft or banks it as ready.
5. Banked posts move season progress.
6. Daily goals and milestones create sealed capsules.
7. User opens capsules manually outside the writing flow.
8. Collection shelf fills with voxel-style classic figurines.

## Non-Goals
- No Telegram integration in MVP.
- No AI generation or AI review in MVP.
- No currency, tickets, shop, or monetized gacha in MVP.
- No social network or public profiles in MVP.

## Current Deployment
- Static SPA hosted on GitHub Pages.
- Supabase cloud handles Auth, Postgres, RLS, and RPC.
- URL: `https://llayon.github.io/Motivation-Blues/`
- Repository: `https://github.com/Llayon/Motivation-Blues`

## Important Product Tone
The app should feel like a calm, premium writing room, not a generic productivity SaaS dashboard. Rewards should be delightful but never interrupt writing flow.
