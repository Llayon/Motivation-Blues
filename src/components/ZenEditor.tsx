import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type EditorBufferRecord,
  clearEditorBuffer,
  loadEditorBuffer,
  saveEditorBuffer
} from '../lib/editorBuffer';
import { applyTelegramFormat, type TelegramFormat } from '../lib/telegramFormatting';
import { useAppStore } from '../store/useAppStore';
import type { Post } from '../types';

function tagsToInput(tags: string[]) {
  return tags.join(', ');
}

function inputToTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function formatEditorTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getManuscriptStatus(wordCount: number) {
  if (wordCount > 1000) {
    return 'Толстой одобряет';
  }

  if (wordCount > 500) {
    return 'Уверенный лонгрид';
  }

  if (wordCount >= 200) {
    return 'Колонка';
  }

  if (wordCount >= 50) {
    return 'Заметка';
  }

  return 'Эскиз';
}

function getDraftShelfStatus(updatedAt: string) {
  const updated = new Date(updatedAt);
  const today = new Date();
  const updatedDate = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.floor((todayDate.getTime() - updatedDate.getTime()) / 86_400_000);

  if (diffDays <= 0) {
    return 'Чернила еще сохнут';
  }

  if (diffDays > 3) {
    return 'Собирает пыль';
  }

  return 'Ждет искры';
}

function hasBufferContent(record: EditorBufferRecord | null | undefined) {
  return Boolean(
    record &&
      (record.title.trim().length > 0 ||
        record.content.length > 0 ||
        record.tagsInput.trim().length > 0)
  );
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
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasLoadedBufferRef = useRef(false);
  const userTypedBeforeRestoreRef = useRef(false);

  const editingPost = editingId ? posts.find((post) => post.id === editingId) : undefined;
  const isEditingBankedPost = editingPost?.status === 'banked';
  const charCount = content.trim().length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const manuscriptStatus = getManuscriptStatus(wordCount);
  const canSave = charCount > 0;
  const hasTextareaSelection = selection.end > selection.start;

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
        setStatus(`Рукопись вернулась из стола: ${formatEditorTime(record.updatedAt)}.`);
        setBufferStatus('Автосейв готов.');
        return;
      }

      setBufferStatus('Автосейв готов.');
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

    void getPostOpenDecision(targetPost).then((decision) => {
      if (isCancelled) {
        return;
      }

      if (decision.kind === 'conflict') {
        setConflictPost(targetPost);
        setStatus('В столе уже лежит незавершенный текст.');
        return;
      }

      loadPostIntoEditor(targetPost, decision.buffer);
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
        setBufferStatus('Не удалось очистить стол.');
      });
      setBufferStatus('Стол пуст. Автосейв готов.');
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
        setBufferStatus(`Сохранено в ${formatEditorTime(updatedAt)}`);
      })
      .catch(() => {
        setBufferStatus('Не удалось сохранить в стол.');
      });
  }, [content, editingId, profile, tags, title]);

  function markUserInput() {
    userTypedBeforeRestoreRef.current = true;
  }

  function syncTextareaSelection() {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    setSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    });
  }

  function handleApplyFormat(format: TelegramFormat) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const result = applyTelegramFormat({
      value: content,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd
    }, format);

    markUserInput();
    setContent(result.value);
    setSelection({
      start: result.selectionStart,
      end: result.selectionEnd
    });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  function loadPostIntoEditor(post: Post, buffer?: EditorBufferRecord) {
    setEditingId(post.id);
    setTitle(buffer?.title ?? post.title);
    setContent(buffer?.content ?? post.content);
    setTags(buffer?.tagsInput ?? tagsToInput(post.tags));
    setConflictPost(null);
    setStatus(post.status === 'banked' ? 'Архив. Нет предела совершенству (Вне фокуса дня).' : null);
  }

  function isEditorDirty() {
    const hasAnyInput =
      title.trim().length > 0 || content.length > 0 || tags.trim().length > 0;

    if (!hasAnyInput) {
      return false;
    }

    if (!editingPost) {
      return true;
    }

    return (
      title !== editingPost.title ||
      content !== editingPost.content ||
      tags !== tagsToInput(editingPost.tags)
    );
  }

  async function getPostOpenDecision(targetPost: Post): Promise<
    | { kind: 'open'; buffer?: EditorBufferRecord }
    | { kind: 'conflict' }
  > {
    const record = profile ? await loadEditorBuffer(profile.id) : null;
    const hasDirtyVisibleBuffer = editingId !== targetPost.id && isEditorDirty();
    const hasUnrelatedStoredBuffer =
      record &&
      record.postId !== targetPost.id &&
      hasBufferContent(record) &&
      (!editingId || record.postId !== editingId || isEditorDirty());

    if (hasDirtyVisibleBuffer || hasUnrelatedStoredBuffer) {
      return { kind: 'conflict' };
    }

    return {
      kind: 'open',
      buffer: record?.postId === targetPost.id ? record : undefined
    };
  }

  async function openPostWithBufferGuard(post: Post) {
    const decision = await getPostOpenDecision(post);

    if (decision.kind === 'conflict') {
      setConflictPost(post);
      setStatus('В столе уже лежит незавершенный текст.');
      return;
    }

    loadPostIntoEditor(post, decision.buffer);
    clearEditorTarget();
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
      setStatus('Убрано в стол.');
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
    setStatus('Отправлено в банк.');
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
    setStatus('Продолжаем текущую рукопись.');
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
            <p className="muted">В столе пока пусто.</p>
          ) : (
            drafts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                className={draft.id === editingId ? 'draft-card active' : 'draft-card'}
                onClick={() => void openPostWithBufferGuard(draft)}
              >
                <strong>{draft.title || 'Без названия'}</strong>
                <span>{getDraftShelfStatus(draft.updatedAt)} · {draft.charCount} знаков</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <article className="zen-editor glass-panel">
        {conflictPost ? (
          <div className="editor-conflict" data-testid="editor-conflict">
            <p className="eyebrow">Аварийный буфер</p>
            <h2>В столе уже лежит незавершенный текст</h2>
            <p>
              Можно продолжить текущую рукопись или открыть выбранный текст
              «{conflictPost.title || 'Без названия'}».
            </p>
            <div className="hero-actions">
              <button className="ghost-button" type="button" onClick={keepBufferFromConflict}>
                Оставить текущий
              </button>
              <button className="primary-button" type="button" onClick={editConflictPost}>
                Открыть выбранный
              </button>
            </div>
          </div>
        ) : null}
        <input
          className="title-input"
          data-testid="editor-title"
          placeholder="Как назовем?"
          value={title}
          onChange={(event) => {
            markUserInput();
            setTitle(event.target.value);
          }}
        />
        <div className="editor-textarea-shell">
          {hasTextareaSelection ? (
            <div className="formatting-menu glass-panel" data-testid="formatting-menu">
              <button
                aria-label="Жирный"
                data-testid="format-bold"
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleApplyFormat('bold');
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
                  handleApplyFormat('italic');
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
                  handleApplyFormat('link');
                }}
              >
                Link
              </button>
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            className="post-textarea"
            data-testid="editor-content"
            placeholder="Рукописи не горят. Начинай..."
            value={content}
            onChange={(event) => {
              markUserInput();
              setContent(event.target.value);
              syncTextareaSelection();
            }}
            onKeyUp={syncTextareaSelection}
            onMouseUp={syncTextareaSelection}
            onSelect={syncTextareaSelection}
          />
        </div>
        <input
          className="tag-input"
          data-testid="editor-tags"
          placeholder="Теги: идеи, личное, продукт"
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
            <span>{manuscriptStatus}</span>
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
                  {isSaving ? 'Обновляю...' : 'Обновить в архиве'}
                </button>
              </>
            ) : (
              <>
                <button className="ghost-button" data-testid="save-draft" type="button" disabled={!canSave || isSaving} onClick={handleSaveDraft}>
                  {isSaving ? 'Убираю...' : 'Убрать в стол'}
                </button>
                <button className="primary-button" data-testid="bank-post" type="button" disabled={!canSave || isSaving} onClick={handleBankPost}>
                  {isSaving ? 'Отправляю...' : 'Отправить в банк'}
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
