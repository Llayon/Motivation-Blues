type EditorFooterProps = {
  charCount: number;
  wordCount: number;
  manuscriptStatus: string;
  bufferStatus: string;
  status: string | null;
  isEditingBankedPost: boolean;
  isSaving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onUpdateBankedPost: () => void;
  onSaveDraft: () => void;
  onBankPost: () => void;
  onOpenBank: () => void;
};

export function EditorFooter({
  charCount,
  wordCount,
  manuscriptStatus,
  bufferStatus,
  status,
  isEditingBankedPost,
  isSaving,
  canSave,
  onCancel,
  onUpdateBankedPost,
  onSaveDraft,
  onBankPost,
  onOpenBank
}: EditorFooterProps) {
  return (
    <div className="editor-footer">
      <div className="editor-metrics">
        <span>{charCount} знаков</span>
        <span>{wordCount} слов</span>
        <span>{manuscriptStatus}</span>
        <span className="editor-autosave" data-testid="autosave-status">
          {bufferStatus}
        </span>
        {status ? <span className="positive">{status}</span> : null}
      </div>
      <div className="editor-actions">
        {isEditingBankedPost ? (
          <>
            <button className="ghost-button" type="button" disabled={isSaving} onClick={onCancel}>
              Отменить
            </button>
            <button
              className="primary-button"
              data-testid="update-banked-post"
              type="button"
              disabled={!canSave || isSaving}
              onClick={onUpdateBankedPost}
            >
              {isSaving ? 'Обновляю...' : 'Обновить в архиве'}
            </button>
          </>
        ) : (
          <>
            <button
              className="ghost-button"
              data-testid="save-draft"
              type="button"
              disabled={!canSave || isSaving}
              onClick={onSaveDraft}
            >
              {isSaving ? 'Убираю...' : 'Убрать в стол'}
            </button>
            <button
              className="primary-button"
              data-testid="bank-post"
              type="button"
              disabled={!canSave || isSaving}
              onClick={onBankPost}
            >
              {isSaving ? 'Отправляю...' : 'Отправить в банк'}
            </button>
          </>
        )}
        <button className="plain-button" type="button" onClick={onOpenBank}>
          Банк постов
        </button>
      </div>
    </div>
  );
}
