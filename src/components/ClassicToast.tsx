import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

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

  return (
    <aside className="classic-toast glass-panel" role="status">
      <span>{feedback.classicName}</span>
      <p>{feedback.text}</p>
      <button type="button" onClick={clearFeedback} aria-label="Закрыть">
        ×
      </button>
    </aside>
  );
}
