import { FormEvent, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { useAppStore } from '../store/useAppStore';

export function AuthGate() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const startSession = useAppStore((state) => state.startSession);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);
  const cloudError = useAppStore((state) => state.cloudError);

  async function handleMagicLink(event?: FormEvent) {
    event?.preventDefault();
    if (!supabase || !email.trim()) {
      setStatus('Введите email, чтобы начать марафон.');
      return;
    }

    setIsSending(true);
    const redirectUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    setIsSending(false);
    setStatus(error ? error.message : 'Magic link отправлен. Открой письмо и вернись в приложение.');
  }

  function handleStartLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setStatus('Введите email, чтобы начать марафон.');
      return;
    }

    startSession(email.trim());
  }

  async function handleReturnToTexts() {
    setStatus(null);

    if (isSupabaseConfigured) {
      await hydrateFromSupabase();
      if (useAppStore.getState().profile) {
        return;
      }
    }

    startSession(email.trim() || 'local@author.test');
  }

  return (
    <main className="auth-screen">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <section className="auth-card glass-panel">
        <p className="eyebrow">Челлендж + эмоция</p>
        <h1>100 постов за 40 дней. Пиши для себя.</h1>
        <h2>
          Дзен-редактор, который лечит писательский блок. Пиши «в стол»,
          закрывай дневную норму и собирай уникальные награды за каждую победу
          над чистым листом.
        </h2>
        <form
          onSubmit={isSupabaseConfigured ? handleMagicLink : handleStartLocal}
          className="auth-form"
        >
          <label>
            Твой лучший email
            <input
              data-testid="auth-email"
              type="email"
              placeholder="Твой лучший email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" className="primary-button" disabled={isSending}>
            {isSending ? 'Отправляю...' : 'Начать марафон'}
          </button>
        </form>
        <div className="auth-secondary">
          <button
            type="button"
            className="ghost-button"
            data-testid="start-local-mode"
            onClick={() => void handleReturnToTexts()}
          >
            Вернуться к текстам
          </button>
        </div>
        {!isSupabaseConfigured ? (
          <p className="muted">Облачный вход не настроен, тексты будут храниться локально.</p>
        ) : null}
        {cloudError ? <p className="status-line negative">{cloudError}</p> : null}
        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </main>
  );
}
