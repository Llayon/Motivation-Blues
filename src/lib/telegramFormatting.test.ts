import { describe, expect, it } from 'vitest';
import { applyTelegramFormat, isSafeTelegramUrl, parseTelegramMarkup } from './telegramFormatting';

describe('telegram formatting', () => {
  it('wraps selected text in bold markers', () => {
    expect(
      applyTelegramFormat(
        {
          value: 'Пиши смело',
          selectionStart: 5,
          selectionEnd: 10
        },
        'bold'
      )
    ).toEqual({
      value: 'Пиши *смело*',
      selectionStart: 6,
      selectionEnd: 11
    });
  });

  it('wraps selected text in italic markers', () => {
    expect(
      applyTelegramFormat(
        {
          value: 'Пиши смело',
          selectionStart: 5,
          selectionEnd: 10
        },
        'italic'
      )
    ).toEqual({
      value: 'Пиши _смело_',
      selectionStart: 6,
      selectionEnd: 11
    });
  });

  it('creates link markup from selected text and selects the URL', () => {
    expect(
      applyTelegramFormat(
        {
          value: 'Пушкин',
          selectionStart: 0,
          selectionEnd: 6
        },
        'link'
      )
    ).toEqual({
      value: '[Пушкин](https://example.com)',
      selectionStart: 9,
      selectionEnd: 28
    });
  });

  it('parses supported markup tokens', () => {
    expect(parseTelegramMarkup('*Жирно* и _тонко_ [сюда](https://example.com)')).toEqual([
      { type: 'bold', text: 'Жирно' },
      { type: 'text', text: ' и ' },
      { type: 'italic', text: 'тонко' },
      { type: 'text', text: ' ' },
      { type: 'link', text: 'сюда', href: 'https://example.com', isSafe: true }
    ]);
  });

  it('does not treat javascript links as safe links', () => {
    expect(isSafeTelegramUrl('javascript:alert(1)')).toBe(false);
    expect(parseTelegramMarkup('[x](javascript:alert(1))')).toEqual([
      { type: 'text', text: '[x](javascript:alert(1)' },
      { type: 'text', text: ')' }
    ]);
  });
});
