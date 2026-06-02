import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type EditorBufferRecord,
  clearEditorBuffer,
  loadEditorBuffer,
  saveEditorBuffer
} from '../../lib/editorBuffer';
import {
  formatEditorTime,
  getManuscriptStatus,
  hasBufferContent,
  inputToTags,
  tagsToInput
} from '../../lib/editorText';
import { applyTelegramFormat, type TelegramFormat } from '../../lib/telegramFormatting';
import { useAppStore } from '../../store/useAppStore';
import type { Post } from '../../types';

export function useZenEditorController() {
  const profile = useAppStore((state) => state.profile);
  const posts = useAppStore((state) => state.posts);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const bankPost = useAppStore((state) => state.bankPost);
  const updateBankedPost = useAppStore((state) => state.updateBankedPost);
  const editorTargetPostId = useAppStore((state) => state.editorTargetPostId);
  const clearEditorTarget = useAppStore((state) => state.clearEditorTarget);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const drafts = useMemo(
    () =>
      posts
        .filter((post) => post.status === 'draft')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
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

  const isEditorDirty = useCallback(() => {
    const hasAnyInput = title.trim().length > 0 || content.length > 0 || tags.trim().length > 0;

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
  }, [content, editingPost, tags, title]);

  const getPostOpenDecision = useCallback(
    async (
      targetPost: Post
    ): Promise<{ kind: 'open'; buffer?: EditorBufferRecord } | { kind: 'conflict' }> => {
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
    },
    [editingId, isEditorDirty, profile]
  );

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

  function loadPostIntoEditor(post: Post, buffer?: EditorBufferRecord) {
    setEditingId(post.id);
    setTitle(buffer?.title ?? post.title);
    setContent(buffer?.content ?? post.content);
    setTags(buffer?.tagsInput ?? tagsToInput(post.tags));
    setConflictPost(null);
    setStatus(
      post.status === 'banked' ? 'Архив. Нет предела совершенству (Вне фокуса дня).' : null
    );
  }

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
  }, [clearEditorTarget, editorTargetPostId, getPostOpenDecision, posts, profile]);

  useEffect(() => {
    if (!profile || !hasLoadedBufferRef.current) {
      return;
    }

    const hasAnyInput = title.trim().length > 0 || content.length > 0 || tags.trim().length > 0;

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

    const result = applyTelegramFormat(
      {
        value: content,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd
      },
      format
    );

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

  return {
    drafts,
    editingId,
    title,
    content,
    tags,
    status,
    bufferStatus,
    conflictPost,
    textareaRef,
    isEditingBankedPost,
    charCount,
    wordCount,
    manuscriptStatus,
    canSave,
    hasTextareaSelection,
    isSaving,
    handleApplyFormat,
    handleBankPost,
    handleContentChange: (value: string) => {
      markUserInput();
      setContent(value);
    },
    handleSaveDraft,
    handleTagsChange: (value: string) => {
      markUserInput();
      setTags(value);
    },
    handleTitleChange: (value: string) => {
      markUserInput();
      setTitle(value);
    },
    handleUpdateBankedPost,
    keepBufferFromConflict,
    openBank: () => setActiveView('bank'),
    openPostWithBufferGuard,
    resetEditor,
    syncTextareaSelection,
    editConflictPost
  };
}
