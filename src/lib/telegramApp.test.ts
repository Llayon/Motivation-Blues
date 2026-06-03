import { describe, expect, test } from 'vitest';
import { hasTelegramLaunchParams } from './telegramApp';

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
});
