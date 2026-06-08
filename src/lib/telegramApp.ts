// src/lib/telegramApp.ts

const TELEGRAM_SDK_URL = 'https://telegram.org/js/telegram-web-app.js';
const TELEGRAM_SDK_TIMEOUT_MS = 3000;
const TELEGRAM_LAUNCH_PARAMS = ['tgWebAppData', 'tgWebAppVersion', 'tgWebAppPlatform'];

let telegramSdkPromise: Promise<boolean> | null = null;

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  requestFullscreen?: () => void;
  initData: string;
  isFullscreen?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function hasTelegramLaunchParams(href?: string): boolean {
  const currentHref =
    href ?? (typeof window !== 'undefined' ? window.location.href : 'https://app.local/');

  try {
    const url = new URL(currentHref, 'https://app.local/');

    if (TELEGRAM_LAUNCH_PARAMS.some((name) => url.searchParams.has(name))) {
      return true;
    }

    const hash = decodeURIComponent(url.hash.replace(/^#/, ''));
    return TELEGRAM_LAUNCH_PARAMS.some((name) => hash.includes(`${name}=`));
  } catch {
    return false;
  }
}

function getTelegramWebApp(): TelegramWebApp | undefined {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

export function isTelegramEnvironment(): boolean {
  return !!getTelegramWebApp()?.initData;
}

function loadTelegramSdkIfNeeded(): Promise<boolean> {
  if (isTelegramEnvironment()) {
    return Promise.resolve(true);
  }

  if (typeof document === 'undefined' || !hasTelegramLaunchParams()) {
    return Promise.resolve(false);
  }

  if (telegramSdkPromise) {
    return telegramSdkPromise;
  }

  telegramSdkPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TELEGRAM_SDK_URL}"]`
    );
    const script = existingScript ?? document.createElement('script');
    let isSettled = false;

    const finish = (isReady: boolean) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      window.clearTimeout(timeoutId);
      resolve(isReady);
    };

    const timeoutId = window.setTimeout(() => finish(false), TELEGRAM_SDK_TIMEOUT_MS);

    script.async = true;
    script.src = TELEGRAM_SDK_URL;
    script.onload = () => finish(isTelegramEnvironment());
    script.onerror = () => finish(false);

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  return telegramSdkPromise;
}

export async function initTelegramApp(): Promise<boolean> {
  if (!isTelegramEnvironment()) {
    await loadTelegramSdkIfNeeded();
  }

  const WebApp = getTelegramWebApp();

  if (!WebApp?.initData) {
    return false;
  }

  try {
    WebApp.ready();
    WebApp.expand();
    if (!WebApp.isFullscreen) {
      WebApp.requestFullscreen?.();
    }
    return true;
  } catch {
    return false;
  }
}
