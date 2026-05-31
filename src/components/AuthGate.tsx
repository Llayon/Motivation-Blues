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
      setStatus('Введите email, чтобы создать локальный профиль сезона.');
      return;
    }

    startSession(email.trim());
  }

  return (
    <main className="auth-screen">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <section className="auth-card glass-panel">
        <p className="eyebrow">40-дневный челлендж</p>
        <h1>100 постов в банк, без Telegram и без ИИ.</h1>
        <p className="hero-copy">
          Дзен-редактор для начинающего блогера: пишешь в стол, закрываешь норму,
          копишь капсулы вдохновения и собираешь глянцевых воксельных классиков.
        </p>
        <form
          onSubmit={isSupabaseConfigured ? handleMagicLink : handleStartLocal}
          className="auth-form"
        >
          <label>
            Email
            <input
              type="email"
              placeholder="author@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" className="primary-button">
            {isSupabaseConfigured ? 'Отправить magic link' : 'Начать сезон'}
          </button>
        </form>
        {isSupabaseConfigured ? (
          <div className="auth-secondary">
            <button
              type="button"
              className="ghost-button"
              onClick={() => void hydrateFromSupabase()}
            >
              Я уже вошел, обновить сессию
            </button>
            <button
              type="button"
              className="plain-button"
              onClick={() => startSession(email.trim() || 'local@author.test')}
            >
              Локальный режим
            </button>
          </div>
        ) : (
          <p className="muted">
            Supabase env не настроены, поэтому MVP запускается в локальном режиме.
          </p>
        )}
        {cloudError ? <p className="status-line negative">{cloudError}</p> : null}
        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </main>
  );
}
