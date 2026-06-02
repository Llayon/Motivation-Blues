import type { TelegramFormat } from '../../lib/telegramFormatting';

type EditorFormattingMenuProps = {
  onApplyFormat: (format: TelegramFormat) => void;
};

export function EditorFormattingMenu({ onApplyFormat }: EditorFormattingMenuProps) {
  return (
    <div className="formatting-menu glass-panel" data-testid="formatting-menu">
      <button
        aria-label="Жирный"
        data-testid="format-bold"
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          onApplyFormat('bold');
        }}
      >
        B
      </button>
      <button
        aria-label="Курсив"
        data-testid="format-italic"
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          onApplyFormat('italic');
        }}
      >
        I
      </button>
      <button
        aria-label="Ссылка"
        data-testid="format-link"
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          onApplyFormat('link');
        }}
      >
        Link
      </button>
    </div>
  );
}
