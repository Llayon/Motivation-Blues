# Motivation Blues: GEMINI.md

Welcome to the Motivation Blues project. This file provides essential context, architectural rules, and development workflows to ensure high-quality and consistent contributions.

## 🌟 Project Overview

**Motivation Blues** is a gamified, "literary-club" style web editor designed for a 40-day writing challenge (100 posts total). It prioritizes focus, local-first data safety, and a minimalist aesthetic.

- **Goal:** Write 100 posts in 40 days (approx. 2-3 posts/day).
- **Core Loop:** Write in ZenEditor -> Save to Bank -> Earn Progress/Capsules -> View 3D Voxel Collection.
- **Tone:** Supportive, calm, slightly scholarly (classic literary quotes, no "hustle" culture).

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite.
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) with persistence (localStorage + Supabase sync).
- **Backend:** [Supabase](https://supabase.com/) (Auth, Postgres, RLS, RPC).
- **Persistence:** Local-first IndexedDB buffer for the editor (`src/lib/editorBuffer.ts`).
- **3D Graphics:** [React Three Fiber](https://r3f.docs.pmnd.rs/) + [Drei](https://github.com/pmndrs/drei) (Three.js).
- **Testing:** [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (E2E).
- **CI/CD:** GitHub Actions -> GitHub Pages.

## 📂 Core Directory Structure

- `src/components/`: UI components (ZenEditor, Bank, Dashboard, VoxelShowcase, etc.).
- `src/store/useAppStore.ts`: The "Brain" of the app. All state and business logic lives here.
- `src/lib/`: Pure domain logic, helpers, and data processing.
- `src/data/`: Static assets (items, classic phrases).
- `Docs/`: **Mandatory reading.** Detailed specs, architecture, and task tracking.
- `supabase/migrations/`: Database schema (PostgreSQL).

## 📜 Mandatory Rules for Agents

1. **Read Docs First:** Before any major change, read `AGENTS.md`, `Docs/CONTEXT.md`, `Docs/PROJECT_MEMORY.md`, `Docs/ARCHITECTURE.md`, and `Docs/CODEMAP.md`.
2. **Local-First Safety:** Never weaken the IndexedDB autosave logic. The user's active writing must be protected even if the browser crashes or Supabase is offline.
3. **Conventional Commits:** All commits MUST follow the Conventional Commits format (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
4. **No AI Generation:** Do not add features that generate text using LLMs/AI. The product is about the user writing their own content.
5. **Supabase Migrations:** Never edit applied migrations. Always create a new migration for schema changes.
6. **GitHub Pages Support:** Maintain `VITE_BASE_PATH=/Motivation-Blues/` in build/deploy logic.
7. **LLM Workflow:** Use `Docs/TRACEABILITY.md`, `Docs/BOUNDARIES.md`, `Docs/COMMIT_CHECKLIST.md`, and ADR/feature templates when the change is large or architectural.

## 🚀 Key Commands

```bash
# Development
npm install
npm run dev

# Testing & Quality
npm test                 # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run build            # Verify build and types
npm run format:check     # Check Prettier formatting
npm run lint             # Run ESLint
npm run architecture:check # Check import boundaries
npm run size:check       # Advisory file-size budget report
npm run verify           # Unit tests + build
npm run verify:full      # Unit tests + build + E2E + Pages base-path build
npm run quality          # Format + lint + boundaries + docs/ADR + unit/build
npm run quality:full     # Full local quality gate with E2E, Pages build, and Knip
npm run verify:pages     # GitHub Pages base-path build
npm run commitlint:last  # Check commit message format
npm run deadcode         # Knip report-only dead-code check

# Navigation Help
npm run search:assist -- "pattern"  # Fast codebase search

# Supabase
npx supabase start       # Start local Supabase
npm run supabase:push    # Push local migrations to cloud
```

## 🏗️ Architecture & Data Flow

- **Hydration:** The app waits for Zustand persistence, then runs bounded Supabase hydration that fails open if cloud requests stall (`src/App.tsx`, `src/lib/cloudHydration.ts`).
- **Modes:**
  - `cloud`: Syncs with Supabase. Requires auth.
  - `local`: Operates purely in the browser (localStorage). No auth required.
- **Editor Buffer:** Writing state is saved to IndexedDB on every keystroke. It is cleared only on explicit Bank save or New Post.
- **Bank Editing:** Editing a post in the Bank updates its content but **does not** trigger reward/season progress logic (to prevent double-counting).
- **Formatting:** Supports Telegram-style `*bold*`, `_italic_`, and `[text](link)`. Stored as plain text.

## 🛡️ Security & Privacy

- **RLS:** Supabase Row Level Security ensures users can only read/write their own data.
- **Secrets:** Never commit `.env.local` or Supabase service keys.
- **Link Safety:** Link rendering in `TelegramMarkup` is sanitized to prevent XSS.

---

_Refer to `Docs/TASKS.md` for the current backlog._
