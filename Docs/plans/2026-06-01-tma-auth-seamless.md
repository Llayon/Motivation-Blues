# TMA Seamless Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement seamless authentication for Telegram Mini App users without requiring them to enter an email or use magic links.

**Architecture:** We will use a Supabase Edge Function (`telegram-auth`). The client sends Telegram's `initData` to the function. The function validates the signature using the `TELEGRAM_BOT_TOKEN`. If valid, it generates a deterministic `email` and `password` for this Telegram user, creates the user in Supabase Auth via the Admin API (if they don't exist), and returns the credentials. The client then logs in using `signInWithPassword`. This provides a standard Supabase session without complex custom JWT management.

**Tech Stack:** Deno (Edge Functions), Supabase Auth, React, Zustand.

---

### Task 1: Create Edge Function `telegram-auth`

**Files:**

- Create: `supabase/functions/telegram-auth/index.ts`
- Modify: `supabase/config.toml` (if needed, though usually just creating the folder is enough for local dev)

- [ ] **Step 1: Write the Edge Function**

Create `supabase/functions/telegram-auth/index.ts`. This function will validate the Telegram `initData`.

```typescript
// supabase/functions/telegram-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function validateTelegramData(initData: string, botToken: string): any {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = hmac('sha256', 'WebAppData', botToken, 'utf8', 'hex');
  const calculatedHash = hmac('sha256', secretKey, dataCheckString, 'hex', 'hex');

  if (calculatedHash !== hash) {
    throw new Error('Invalid Telegram signature');
  }

  const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    // 24 hours
    throw new Error('Telegram data is outdated');
  }

  const userString = urlParams.get('user');
  if (!userString) throw new Error('No user data found');

  return JSON.parse(userString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured on the server');
    }

    // 1. Validate the Telegram data
    const tgUser = validateTelegramData(initData, botToken);

    // 2. Setup Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 3. Generate deterministic credentials for this Telegram user
    const email = `tma_${tgUser.id}@motivation-blues.local`;
    // Generate a secure, deterministic password so the client can log in
    const password = hmac('sha256', botToken, tgUser.id.toString(), 'utf8', 'hex').toString();

    // 4. Ensure the user exists in Supabase Auth
    const {
      data: { users },
      error: searchError
    } = await supabase.auth.admin.listUsers();

    let userExists = users.some((u) => u.email === email);

    if (!userExists) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          username: tgUser.username
        }
      });
      if (createError) throw createError;
    }

    // 5. Return credentials to the client
    return new Response(JSON.stringify({ email, password }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/telegram-auth/index.ts
git commit -m "feat: add telegram-auth edge function"
```

---

### Task 2: Update App Store for Telegram Auth

**Files:**

- Modify: `src/store/useAppStore.ts`

- [ ] **Step 1: Add `startTelegramSession` to the store**

Add the function to `interface AppState` and its implementation.

```typescript
// Add to AppState interface in src/store/useAppStore.ts:
  startTelegramSession: (initData: string) => Promise<void>;

// Add to the store implementation:
      startTelegramSession: async (initData) => {
        if (!supabase) return;
        set({ isHydrating: true, cloudError: null });

        try {
          // 1. Ask Edge Function to validate initData and give us credentials
          const { data, error: fnError } = await supabase.functions.invoke('telegram-auth', {
            body: { initData }
          });

          if (fnError || !data || data.error) {
            throw new Error(data?.error || fnError?.message || 'Failed to authenticate via Telegram');
          }

          // 2. Log in with the provided credentials
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
          });

          if (signInError) throw signInError;

          // 3. Hydrate state
          await get().hydrateFromSupabase();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Telegram auth failed.';
          set({ isHydrating: false, cloudError: message });
        }
      },
```

- [ ] **Step 2: Verify typescript compilation**

Run: `npm run build`
Expected: Passes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/useAppStore.ts
git commit -m "feat: add startTelegramSession to app store"
```

---

### Task 3: Update AuthGate UI for Seamless Login

**Files:**

- Modify: `src/components/AuthGate.tsx`

- [ ] **Step 1: Add auto-login logic for TMA**

Update `AuthGate.tsx` to detect the Telegram environment. If detected, automatically trigger `startTelegramSession`. While authenticating, show a loading state instead of the email form.

```tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../store/useAppStore';
import { isTelegramEnvironment } from '../lib/telegramApp';

export function AuthGate() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRetryingCloud, setIsRetryingCloud] = useState(false);

  const cloudConfigured = useAppStore((state) => state.cloudConfigured);
  const startSession = useAppStore((state) => state.startSession);
  const requestMagicLink = useAppStore((state) => state.requestMagicLink);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);
  const startTelegramSession = useAppStore((state) => state.startTelegramSession);
  const cloudError = useAppStore((state) => state.cloudError);
  const isHydrating = useAppStore((state) => state.isHydrating);

  const isTelegram = isTelegramEnvironment();

  useEffect(() => {
    if (isTelegram && cloudConfigured && window.Telegram?.WebApp?.initData) {
      // Automatically attempt login when in Telegram
      startTelegramSession(window.Telegram.WebApp.initData);
    }
  }, [isTelegram, cloudConfigured, startTelegramSession]);

  async function handleMagicLink(event?: FormEvent) {
    // ... existing handleMagicLink code ...
    event?.preventDefault();
    if (!cloudConfigured || !email.trim()) {
      setStatus('Введите email, чтобы начать марафон.');
      return;
    }

    setIsSending(true);
    const redirectUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    const errorMessage = await requestMagicLink(email.trim(), redirectUrl);
    setIsSending(false);
    setStatus(errorMessage ?? 'Magic link отправлен. Открой письмо и вернись в приложение.');
  }

  function handleStartLocal(event: FormEvent<HTMLFormElement>) {
    // ... existing handleStartLocal code ...
    event.preventDefault();
    if (!email.trim()) {
      setStatus('Введите email, чтобы начать марафон.');
      return;
    }

    startSession(email.trim());
  }

  async function handleReturnToTexts() {
    // ... existing handleReturnToTexts code ...
    setStatus(null);

    if (cloudConfigured) {
      await hydrateFromSupabase({ blockUi: false });
      if (useAppStore.getState().profile) {
        return;
      }
    }

    startSession(email.trim() || 'local@author.test');
  }

  async function handleCloudRetry() {
    // ... existing handleCloudRetry code ...
    setIsRetryingCloud(true);
    setStatus('Проверяю облако еще раз...');
    await hydrateFromSupabase({ blockUi: false });

    if (useAppStore.getState().profile) {
      return;
    }

    setIsRetryingCloud(false);
    setStatus('Если облако молчит, можно вернуться к текстам локально.');
  }

  return (
    <main className="auth-screen">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <section className="auth-card glass-panel">
        <p className="eyebrow">Челлендж + эмоция</p>
        <h1>100 постов за 40 дней. Пиши для себя.</h1>
        <h2>
          Дзен-редактор, который лечит писательский блок. Пиши «в стол», закрывай дневную норму и
          собирай уникальные награды за каждую победу над чистым листом.
        </h2>

        {isTelegram ? (
          <div className="telegram-auth-status">
            <p>{isHydrating ? 'Связываемся с Telegram...' : 'Вход через Telegram...'}</p>
          </div>
        ) : (
          <form
            onSubmit={cloudConfigured ? handleMagicLink : handleStartLocal}
            className="auth-form"
          >
            <label>
              Твой лучший email
              <input
                data-testid="auth-email"
                type="email"
                placeholder="Твой лучший email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button type="submit" className="primary-button" disabled={isSending}>
              {isSending ? 'Отправляю...' : 'Начать марафон'}
            </button>
          </form>
        )}

        <div className="auth-secondary">
          <button
            type="button"
            className="ghost-button"
            data-testid="start-local-mode"
            onClick={() => void handleReturnToTexts()}
          >
            Вернуться к текстам
          </button>
          {cloudError && cloudConfigured ? (
            <button
              type="button"
              className="ghost-button"
              data-testid="retry-cloud-hydration"
              onClick={() => void handleCloudRetry()}
              disabled={isRetryingCloud}
            >
              {isRetryingCloud ? 'Проверяю...' : 'Проверить облако еще раз'}
            </button>
          ) : null}
        </div>
        {!cloudConfigured ? (
          <p className="muted">Облачный вход не настроен, тексты будут храниться локально.</p>
        ) : null}
        {cloudError ? <p className="status-line negative">{cloudError}</p> : null}
        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Run tests and build**

Run: `npm run build && npm test`
Expected: Tests pass and build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthGate.tsx
git commit -m "feat: seamless Telegram auth in AuthGate"
```
