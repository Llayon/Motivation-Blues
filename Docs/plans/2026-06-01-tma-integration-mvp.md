# Telegram Mini App MVP Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt the application to work smoothly as a Telegram Mini App (TMA) by adding the official SDK, initializing it on startup, and expanding the viewport.

**Architecture:** Client-side integration. We inject the Telegram JS SDK in `index.html`. We create a utility module `src/lib/telegramApp.ts` to encapsulate interacting with the `window.Telegram.WebApp` API and providing minimal type safety. We call initialization logic early in the app lifecycle.

**Tech Stack:** TypeScript, React, HTML, Telegram Web App SDK.

---

### Task 1: Add Telegram SDK and Types

**Files:**

- Modify: `index.html`
- Create: `src/lib/telegramApp.ts`

- [ ] **Step 1: Inject SDK into HTML**

Modify `index.html` to include the Telegram Web App script in the `<head>`.

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <title>100 постов за 40 дней</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create Telegram WebApp utility**

Create `src/lib/telegramApp.ts`. Define minimal types to satisfy TypeScript and a setup function to expand the view and notify Telegram that the app is ready.

```typescript
// src/lib/telegramApp.ts

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function initTelegramApp() {
  const WebApp = window.Telegram?.WebApp;

  if (WebApp) {
    // Notify Telegram that the app is fully loaded
    WebApp.ready();

    // Expand the mini app to take up the full available height
    WebApp.expand();
  }
}

export function isTelegramEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
}
```

- [ ] **Step 3: Run TypeScript checks**

Run: `npm run build`
Expected: Output showing successful build (no TypeScript errors).

- [ ] **Step 4: Commit**

```bash
git add index.html src/lib/telegramApp.ts
git commit -m "feat: add Telegram Mini App SDK and utility types"
```

---

### Task 2: Initialize Telegram App on Startup

**Files:**

- Modify: `src/main.tsx`

- [ ] **Step 1: Call initialization in the entry point**

Modify `src/main.tsx` to import and call `initTelegramApp()` before rendering the React tree.

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { initTelegramApp } from './lib/telegramApp';

// Initialize Telegram Mini App environment if running inside Telegram
initTelegramApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 2: Run tests and build**

Run: `npm run test && npm run build`
Expected: Tests pass and build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: initialize Telegram App on startup"
```
