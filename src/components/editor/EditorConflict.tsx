import type { Post } from '../../types';

type EditorConflictProps = {
  conflictPost: Post;
  onKeepCurrent: () => void;
  onOpenSelected: () => void;
};

export function EditorConflict({
  conflictPost,
  onKeepCurrent,
  onOpenSelected
}: EditorConflictProps) {
  return (
    <div className="editor-conflict" data-testid="editor-conflict">
      <p className="eyebrow">Аварийный буфер</p>
      <h2>В столе уже лежит незавершенный текст</h2>
      <p>
        Можно продолжить текущую рукопись или открыть выбранный текст «
        {conflictPost.title || 'Без названия'}».
      </p>
      <div className="hero-actions">
        <button className="ghost-button" type="button" onClick={onKeepCurrent}>
          Оставить текущий
        </button>
        <button className="primary-button" type="button" onClick={onOpenSelected}>
          Открыть выбранный
        </button>
      </div>
    </div>
  );
}
