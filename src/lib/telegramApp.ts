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
