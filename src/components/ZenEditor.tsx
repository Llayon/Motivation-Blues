import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type EditorBufferRecord,
  clearEditorBuffer,
  loadEditorBuffer,
  saveEditorBuffer
} from '../lib/editorBuffer';
import { useAppStore } from '../store/useAppStore';
import type { Post } from '../types';

function tagsToInput(tags: string[]) {
  return tags.join(', ');
}

function inputToTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function ZenEditor() {
  const profile = useAppStore((state) => state.profile);
  const posts = useAppStore((state) => state.posts);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const bankPost = useAppStore((state) => state.bankPost);
  const updateBankedPost = useAppStore((state) => state.updateBankedPost);
  const editorTargetPostId = useAppStore((state) => state.editorTargetPostId);
  const clearEditorTarget = useAppStore((state) => state.clearEditorTarget);
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
  const [bufferStatus, setBufferStatus] = useState('Автосейв готовит буфер...');
  const [conflictPost, setConflictPost] = useState<Post | null>(null);
  const hasLoadedBufferRef = useRef(false);
  const userTypedBeforeRestoreRef = useRef(false);

  const editingPost = editingId ? posts.find((post) => post.id === editingId) : undefined;
  const isEditingBankedPost = editingPost?.status === 'banked';
  const charCount = content.trim().length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canSave = charCount > 0;

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isCancelled = false;
    hasLoadedBufferRef.current = false;
    userTypedBeforeRestoreRef.current = false;
    setBufferStatus('Проверяю аварийный буфер...');

    void loadEditorBuffer(profile.id).then((record) => {
      if (isCancelled) {
        return;
      }

      hasLoadedBufferRef.current = true;

      if (record && !userTypedBeforeRestoreRef.current) {
        setEditingId(record.postId);
        setTitle(record.title);
        setContent(record.content);
        setTags(record.tagsInput);
        setStatus(
          `Восстановлен локальный буфер от ${new Date(record.updatedAt).toLocaleTimeString('ru-RU')}.`
        );
        setBufferStatus('Терминаторский автосейв включен.');
        return;
      }

      setBufferStatus('Терминаторский автосейв включен.');
    });

    return () => {
      isCancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!profile || !editorTargetPostId) {
      return;
    }

    const targetPost = posts.find((post) => post.id === editorTargetPostId);
    if (!targetPost) {
      return;
    }

    let isCancelled = false;

    void loadEditorBuffer(profile.id).then((record) => {
      if (isCancelled) {
        return;
      }

      const hasUnrelatedBuffer =
        record &&
        record.postId !== targetPost.id &&
        (record.title.trim().length > 0 ||
          record.content.length > 0 ||
          record.tagsInput.trim().length > 0);

      if (hasUnrelatedBuffer) {
        setConflictPost(targetPost);
        setStatus('Есть несохраненный локальный буфер. Выберите, что открыть.');
        return;
      }

      loadPostIntoEditor(targetPost, record?.postId === targetPost.id ? record : undefined);
      clearEditorTarget();
    });

    return () => {
      isCancelled = true;
    };
  }, [clearEditorTarget, editorTargetPostId, posts, profile]);

  useEffect(() => {
    if (!profile || !hasLoadedBufferRef.current) {
      return;
    }

    const hasAnyInput =
      title.trim().length > 0 || content.length > 0 || tags.trim().length > 0;

    if (!hasAnyInput) {
      void clearEditorBuffer(profile.id).catch(() => {
        setBufferStatus('Автосейв: не удалось очистить локальный буфер.');
      });
      setBufferStatus('Буфер пуст. Автосейв включен.');
      return;
    }

    const updatedAt = new Date().toISOString();
    void saveEditorBuffer({
      userId: profile.id,
      postId: editingId,
      title,
      content,
      tagsInput: tags,
      updatedAt
    })
      .then(() => {
        setBufferStatus(`Сохранено локально: ${new Date(updatedAt).toLocaleTimeString('ru-RU')}`);
      })
      .catch(() => {
        setBufferStatus('Автосейв: локальное сохранение не прошло.');
      });
  }, [content, editingId, profile, tags, title]);

  function markUserInput() {
    userTypedBeforeRestoreRef.current = true;
  }

  function loadPostIntoEditor(post: Post, buffer?: EditorBufferRecord) {
    setEditingId(post.id);
    setTitle(buffer?.title ?? post.title);
    setContent(buffer?.content ?? post.content);
    setTags(buffer?.tagsInput ?? tagsToInput(post.tags));
    setConflictPost(null);
    setStatus(post.status === 'banked' ? 'Редактируется пост из банка.' : null);
  }

  function loadDraft(post: Post) {
    loadPostIntoEditor(post);
  }

  async function resetEditor() {
    setEditingId(undefined);
    setTitle('');
    setContent('');
    setTags('');
    setStatus(null);
    setConflictPost(null);
    clearEditorTarget();
    if (profile) {
      await clearEditorBuffer(profile.id);
    }
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
      if (profile) {
        await saveEditorBuffer({
          userId: profile.id,
          postId: id,
          title,
          content,
          tagsInput: tags,
          updatedAt: new Date().toISOString()
        });
      }
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
    if (profile) {
      await clearEditorBuffer(profile.id);
    }
    await resetEditor();
  }

  async function handleUpdateBankedPost() {
    setIsSaving(true);
    const didUpdate = await updateBankedPost({
      id: editingId,
      title,
      content,
      tags: inputToTags(tags)
    });
    setIsSaving(false);

    if (!didUpdate) {
      setStatus('Не удалось обновить пост в банке.');
      return;
    }

    if (profile) {
      await clearEditorBuffer(profile.id);
    }
    await resetEditor();
    setActiveView('bank');
  }

  async function keepBufferFromConflict() {
    setConflictPost(null);
    clearEditorTarget();
  }

  async function editConflictPost() {
    if (!profile || !conflictPost) {
      return;
    }

    await clearEditorBuffer(profile.id);
    loadPostIntoEditor(conflictPost);
    clearEditorTarget();
  }

  return (
    <section className="editor-layout">
      <aside className="draft-rail glass-panel">
        <div className="section-heading">
          <p className="eyebrow">Черновики</p>
          <button type="button" onClick={() => void resetEditor()}>
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
        {conflictPost ? (
          <div className="editor-conflict" data-testid="editor-conflict">
            <p className="eyebrow">Аварийный буфер</p>
            <h2>Не перезаписываю несохраненный текст</h2>
            <p>
              Сейчас в редакторе восстановлен локальный буфер. Можно оставить его
              или явно перейти к редактированию поста «{conflictPost.title || 'Без названия'}».
            </p>
            <div className="hero-actions">
              <button className="ghost-button" type="button" onClick={keepBufferFromConflict}>
                Восстановить буфер
              </button>
              <button className="primary-button" type="button" onClick={editConflictPost}>
                Редактировать выбранный пост
              </button>
            </div>
          </div>
        ) : null}
        <input
          className="title-input"
          data-testid="editor-title"
          placeholder="Заголовок поста"
          value={title}
          onChange={(event) => {
            markUserInput();
            setTitle(event.target.value);
          }}
        />
        <textarea
          className="post-textarea"
          data-testid="editor-content"
          placeholder="Пиши спокойно. В банк уйдет только то, что ты явно сохранишь."
          value={content}
          onChange={(event) => {
            markUserInput();
            setContent(event.target.value);
          }}
        />
        <input
          className="tag-input"
          data-testid="editor-tags"
          placeholder="Теги через запятую: идеи, личное, продукт"
          value={tags}
          onChange={(event) => {
            markUserInput();
            setTags(event.target.value);
          }}
        />
        <div className="editor-footer">
          <div className="editor-metrics">
            <span>{charCount} знаков</span>
            <span>{wordCount} слов</span>
            <span className="editor-autosave" data-testid="autosave-status">{bufferStatus}</span>
            {status ? <span className="positive">{status}</span> : null}
          </div>
          <div className="editor-actions">
            {isEditingBankedPost ? (
              <>
                <button className="ghost-button" type="button" disabled={isSaving} onClick={() => void resetEditor()}>
                  Отменить
                </button>
                <button className="primary-button" data-testid="update-banked-post" type="button" disabled={!canSave || isSaving} onClick={handleUpdateBankedPost}>
                  {isSaving ? 'Обновляю...' : 'Обновить в банке'}
                </button>
              </>
            ) : (
              <>
                <button className="ghost-button" data-testid="save-draft" type="button" disabled={!canSave || isSaving} onClick={handleSaveDraft}>
                  {isSaving ? 'Сохраняю...' : 'Сохранить черновик'}
                </button>
                <button className="primary-button" data-testid="bank-post" type="button" disabled={!canSave || isSaving} onClick={handleBankPost}>
                  Сохранить в банк
                </button>
              </>
            )}
            <button className="plain-button" type="button" onClick={() => setActiveView('bank')}>
              Банк постов
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
