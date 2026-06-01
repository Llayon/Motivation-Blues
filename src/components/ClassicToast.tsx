import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ClassicId } from '../types';

const HAS_AVATAR: Partial<Record<ClassicId, boolean>> = {
  pushkin: true,
  gogol: true
};

export function ClassicToast() {
  const feedback = useAppStore((state) => state.feedback);
  const clearFeedback = useAppStore((state) => state.clearFeedback);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(clearFeedback, 6200);
    return () => window.clearTimeout(timeoutId);
  }, [clearFeedback, feedback]);

  if (!feedback) {
    return null;
  }

  const hasAvatar = HAS_AVATAR[feedback.classicId];

  return (
    <aside className="classic-toast glass-panel" role="status">
      {hasAvatar && (
        <img
          src={`${import.meta.env.BASE_URL}avatars/${feedback.classicId}.png`}
          alt={`Аватар ${feedback.classicName}`}
          className="classic-avatar"
        />
      )}
      <div className="classic-toast-content">
        <span>{feedback.classicName}</span>
        <p>{feedback.text}</p>
      </div>
      <button type="button" onClick={clearFeedback} aria-label="Закрыть">
        ×
      </button>
    </aside>
  );
}
