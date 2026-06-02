import type { EditorBufferRecord } from './editorBuffer';

export function tagsToInput(tags: string[]) {
  return tags.join(', ');
}

export function inputToTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatEditorTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getManuscriptStatus(wordCount: number) {
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

export function getDraftShelfStatus(updatedAt: string) {
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

export function hasBufferContent(record: EditorBufferRecord | null | undefined) {
  return Boolean(
    record &&
    (record.title.trim().length > 0 ||
      record.content.length > 0 ||
      record.tagsInput.trim().length > 0)
  );
}
