import { parseTelegramMarkup } from '../lib/telegramFormatting';

interface TelegramMarkupProps {
  text: string;
}

export function TelegramMarkup({ text }: TelegramMarkupProps) {
  const tokens = parseTelegramMarkup(text);

  return (
    <>
      {tokens.map((token, index) => {
        const key = `${token.type}:${index}`;

        if (token.type === 'bold') {
          return <strong key={key}>{token.text}</strong>;
        }

        if (token.type === 'italic') {
          return <em key={key}>{token.text}</em>;
        }

        if (token.type === 'link') {
          return (
            <a key={key} href={token.href} target="_blank" rel="noreferrer">
              {token.text}
            </a>
          );
        }

        return <span key={key}>{token.text}</span>;
      })}
    </>
  );
}
