export type TelegramFormat = 'bold' | 'italic' | 'link';

export interface FormattingSelection {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export type FormattingResult = FormattingSelection;

export type TelegramMarkupToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'link'; text: string; href: string; isSafe: true };

const LINK_PLACEHOLDER = 'https://example.com';

function wrapSelection(
  input: FormattingSelection,
  prefix: string,
  suffix: string,
  placeholder: string
): FormattingResult {
  const selected = input.value.slice(input.selectionStart, input.selectionEnd);
  const text = selected || placeholder;
  const value =
    input.value.slice(0, input.selectionStart) +
    prefix +
    text +
    suffix +
    input.value.slice(input.selectionEnd);
  const selectionStart = input.selectionStart + prefix.length;

  return {
    value,
    selectionStart,
    selectionEnd: selectionStart + text.length
  };
}

export function applyTelegramFormat(
  input: FormattingSelection,
  format: TelegramFormat
): FormattingResult {
  if (format === 'bold') {
    return wrapSelection(input, '*', '*', 'жирный');
  }

  if (format === 'italic') {
    return wrapSelection(input, '_', '_', 'курсив');
  }

  const selected = input.value.slice(input.selectionStart, input.selectionEnd);
  const text = selected || 'текст';
  const replacement = `[${text}](${LINK_PLACEHOLDER})`;
  const value =
    input.value.slice(0, input.selectionStart) +
    replacement +
    input.value.slice(input.selectionEnd);

  if (!selected) {
    const selectionStart = input.selectionStart + 1;
    return {
      value,
      selectionStart,
      selectionEnd: selectionStart + text.length
    };
  }

  const selectionStart = input.selectionStart + `[${text}](`.length;
  return {
    value,
    selectionStart,
    selectionEnd: selectionStart + LINK_PLACEHOLDER.length
  };
}

export function isSafeTelegramUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function findNextMarkup(value: string, fromIndex: number) {
  const candidates = [
    { type: 'bold' as const, index: value.indexOf('*', fromIndex) },
    { type: 'italic' as const, index: value.indexOf('_', fromIndex) },
    { type: 'link' as const, index: value.indexOf('[', fromIndex) }
  ].filter((candidate) => candidate.index >= 0);

  return candidates.sort((left, right) => left.index - right.index)[0];
}

export function parseTelegramMarkup(value: string): TelegramMarkupToken[] {
  const tokens: TelegramMarkupToken[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const next = findNextMarkup(value, cursor);

    if (!next) {
      tokens.push({ type: 'text', text: value.slice(cursor) });
      break;
    }

    if (next.index > cursor) {
      tokens.push({ type: 'text', text: value.slice(cursor, next.index) });
    }

    if (next.type === 'bold' || next.type === 'italic') {
      const marker = next.type === 'bold' ? '*' : '_';
      const end = value.indexOf(marker, next.index + 1);

      if (end <= next.index + 1) {
        tokens.push({ type: 'text', text: marker });
        cursor = next.index + 1;
        continue;
      }

      tokens.push({
        type: next.type,
        text: value.slice(next.index + 1, end)
      });
      cursor = end + 1;
      continue;
    }

    const textEnd = value.indexOf('](', next.index);
    const linkEnd = textEnd >= 0 ? value.indexOf(')', textEnd + 2) : -1;

    if (textEnd < 0 || linkEnd < 0 || textEnd === next.index) {
      tokens.push({ type: 'text', text: '[' });
      cursor = next.index + 1;
      continue;
    }

    const text = value.slice(next.index + 1, textEnd);
    const href = value.slice(textEnd + 2, linkEnd);
    const raw = value.slice(next.index, linkEnd + 1);

    if (isSafeTelegramUrl(href)) {
      tokens.push({ type: 'link', text, href, isSafe: true });
    } else {
      tokens.push({ type: 'text', text: raw });
    }

    cursor = linkEnd + 1;
  }

  return tokens.filter((token) => token.text.length > 0);
}
