import { afterEach, describe, expect, test, vi } from 'vitest';
import { hasTelegramLaunchParams, initTelegramApp } from './telegramApp';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('telegram launch detection', () => {
  test('detects Telegram launch params in query', () => {
    expect(hasTelegramLaunchParams('https://app.local/?tgWebAppData=payload')).toBe(true);
  });

  test('detects Telegram launch params in hash', () => {
    expect(
      hasTelegramLaunchParams('https://app.local/#tgWebAppVersion=7.0&tgWebAppData=payload')
    ).toBe(true);
  });

  test('ignores ordinary browser URLs', () => {
    expect(hasTelegramLaunchParams('https://app.local/?draft=1#editor')).toBe(false);
  });

  test('requests fullscreen when Telegram client supports it', async () => {
    const ready = vi.fn();
    const expand = vi.fn();
    const requestFullscreen = vi.fn();

    vi.stubGlobal('window', {
      Telegram: {
        WebApp: {
          initData: 'query_id=test',
          isFullscreen: false,
          ready,
          expand,
          requestFullscreen
        }
      }
    });

    await expect(initTelegramApp()).resolves.toBe(true);
    expect(ready).toHaveBeenCalledOnce();
    expect(expand).toHaveBeenCalledOnce();
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  test('falls back to expand without fullscreen API', async () => {
    const ready = vi.fn();
    const expand = vi.fn();

    vi.stubGlobal('window', {
      Telegram: {
        WebApp: {
          initData: 'query_id=test',
          ready,
          expand
        }
      }
    });

    await expect(initTelegramApp()).resolves.toBe(true);
    expect(ready).toHaveBeenCalledOnce();
    expect(expand).toHaveBeenCalledOnce();
  });
});
