import { getDraftShelfStatus } from '../../lib/editorText';
import type { Post } from '../../types';

type EditorDraftRailProps = {
  drafts: Post[];
  editingId?: string;
  onNew: () => void;
  onOpenDraft: (draft: Post) => void;
};

export function EditorDraftRail({ drafts, editingId, onNew, onOpenDraft }: EditorDraftRailProps) {
  return (
    <aside className="draft-rail glass-panel">
      <div className="section-heading">
        <p className="eyebrow">Черновики</p>
        <button type="button" onClick={onNew}>
          Новый
        </button>
      </div>
      <div className="draft-list">
        {drafts.length === 0 ? (
          <p className="muted">В столе пока пусто.</p>
        ) : (
          drafts.map((draft) => (
            <button
              key={draft.id}
              type="button"
              className={draft.id === editingId ? 'draft-card active' : 'draft-card'}
              onClick={() => onOpenDraft(draft)}
            >
              <strong>{draft.title || 'Без названия'}</strong>
              <span>
                {getDraftShelfStatus(draft.updatedAt)} · {draft.charCount} знаков
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
