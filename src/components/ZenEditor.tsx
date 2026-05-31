import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Post } from '../types';

function tagsToInput(tags: string[]) {
  return tags.join(', ');
}

function inputToTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function ZenEditor() {
  const posts = useAppStore((state) => state.posts);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const bankPost = useAppStore((state) => state.bankPost);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const drafts = useMemo(
    () => posts.filter((post) => post.status === 'draft').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [posts]
  );

  const [editingId, setEditingId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const charCount = content.trim().length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canSave = charCount > 0;

  function loadDraft(post: Post) {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setTags(tagsToInput(post.tags));
    setStatus(null);
  }

  function resetEditor() {
    setEditingId(undefined);
    setTitle('');
    setContent('');
    setTags('');
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    const id = await saveDraft({
      id: editingId,
      title,
      content,
      tags: inputToTags(tags)
    });
    setIsSaving(false);
    if (id) {
      setEditingId(id);
      setStatus('Черновик сохранен.');
    }
  }

  async function handleBankPost() {
    setIsSaving(true);
    await bankPost({
      id: editingId,
      title,
      content,
      tags: inputToTags(tags)
    });
    setIsSaving(false);
    setStatus('Пост сохранен в банк.');
    resetEditor();
  }

  return (
    <section className="editor-layout">
      <aside className="draft-rail glass-panel">
        <div className="section-heading">
          <p className="eyebrow">Черновики</p>
          <button type="button" onClick={resetEditor}>
            Новый
          </button>
        </div>
        <div className="draft-list">
          {drafts.length === 0 ? (
            <p className="muted">Пока пусто. Первый черновик появится после сохранения.</p>
          ) : (
            drafts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                className={draft.id === editingId ? 'draft-card active' : 'draft-card'}
                onClick={() => loadDraft(draft)}
              >
                <strong>{draft.title || 'Без названия'}</strong>
                <span>{draft.charCount} знаков</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <article className="zen-editor glass-panel">
        <input
          className="title-input"
          placeholder="Заголовок поста"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="post-textarea"
          placeholder="Пиши спокойно. В банк уйдет только то, что ты явно сохранишь."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <input
          className="tag-input"
          placeholder="Теги через запятую: идеи, личное, продукт"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
        <div className="editor-footer">
          <div className="editor-metrics">
            <span>{charCount} знаков</span>
            <span>{wordCount} слов</span>
            {status ? <span className="positive">{status}</span> : null}
          </div>
          <div className="editor-actions">
            <button className="ghost-button" type="button" disabled={!canSave || isSaving} onClick={handleSaveDraft}>
              {isSaving ? 'Сохраняю...' : 'Сохранить черновик'}
            </button>
            <button className="primary-button" type="button" disabled={!canSave || isSaving} onClick={handleBankPost}>
              Сохранить в банк
            </button>
            <button className="plain-button" type="button" onClick={() => setActiveView('bank')}>
              Банк постов
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
