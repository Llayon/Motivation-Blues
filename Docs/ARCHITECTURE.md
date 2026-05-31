# Architecture

## Runtime Shape
The app is a static SPA deployed to GitHub Pages. Supabase provides Auth, Postgres, RLS, and RPC. There is no custom Node backend.

## Frontend
- Entry: `src/main.tsx`.
- Root view routing: `src/App.tsx` with Zustand `activeView`.
- UI components: `src/components/`.
- Domain constants and helpers: `src/lib/`, `src/data/`.
- Global state: `src/store/useAppStore.ts`.

## State Flow
1. `App` hydrates Supabase session if Supabase env is configured.
2. `useAppStore` loads profile, posts, daily progress, capsules, and inventory.
3. UI reads state directly from Zustand.
4. Cloud mode writes posts and reward actions through Supabase tables/RPC.
5. Local mode keeps the same behavior in local Zustand persistence.

## Editor Autosave
- File: `src/lib/editorBuffer.ts`.
- Storage: IndexedDB object store `active-editor-buffers`.
- Key: `userId`.
- Fallback: `localStorage`.
- Purpose: protect active text even before draft/bank save.
- Save behavior: every title/content/tag change writes to the local buffer.
- Clear behavior: explicit new editor or successful bank save clears the buffer.
- Banked edit flow: `Bank` calls `openPostInEditor(postId)`, Zustand stores `editorTargetPostId`, and `ZenEditor` loads that post after checking the local buffer.
- Conflict behavior: unrelated emergency buffers are kept visible until the user explicitly keeps the buffer or opens the selected banked post.

## Bank Navigation
- Component: `src/components/Bank.tsx`.
- Filtering helper: `src/lib/bankFilters.ts`.
- Search checks post title, content, and tags.
- Tag filters use AND semantics for multiple selected tags.
- Updating an existing banked post uses `updateBankedPost` and must not call reward/progress banking logic.

## Supabase
- Client: `src/services/supabase.ts`.
- Cloud data loading and mutations: `src/store/useAppStore.ts`.
- Migrations: `supabase/migrations/`.
- Config: `supabase/config.toml`.
- Project ref: `ryvvthzzlnbejyvlrqup`.

## RPC Responsibilities
- `bank_post(post_id)`: transitions a post from draft to banked, updates season counters, creates daily/milestone capsules.
- `open_capsule(capsule_id)`: validates ownership, rolls rarity, creates inventory row, marks capsule opened.

## Deployment
- Workflow: `.github/workflows/deploy-pages.yml`.
- Base path: `VITE_BASE_PATH=/Motivation-Blues/`.
- URL: `https://llayon.github.io/Motivation-Blues/`.
- Supabase magic-link redirects must include the same URL and local dev URLs.

## 3D
- File: `src/components/VoxelShowcase.tsx`.
- Current implementation uses procedural placeholder voxel-style meshes.
- Future GLTF assets should preserve source materials; lighting can be adjusted but model materials should not be rewritten unless deliberately updating asset art.
