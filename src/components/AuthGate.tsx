import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAppStore } from '../store/useAppStore';
import { isTelegramEnvironment } from '../lib/telegramApp';

export function AuthGate() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRetryingCloud, setIsRetryingCloud] = useState(false);
  const cloudConfigured = useAppStore((state) => state.cloudConfigured);
  const startSession = useAppStore((state) => state.startSession);
  const requestMagicLink = useAppStore((state) => state.requestMagicLink);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);
  const cloudError = useAppStore((state) => state.cloudError);
  const startTelegramSession = useAppStore((state) => state.startTelegramSession);
  const isHydrating = useAppStore((state) => state.isHydrating);

  const isTelegram = isTelegramEnvironment();
  const hasAttemptedTgAuth = useRef(false);

  useEffect(() => {
    if (
      isTelegram &&
      cloudConfigured &&
      window.Telegram?.WebApp?.initData &&
      !hasAttemptedTgAuth.current
    ) {
      hasAttemptedTgAuth.current = true;
      // Automatically attempt login when in Telegram
      startTelegramSession(window.Telegram.WebApp.initData);
    }
  }, [isTelegram, cloudConfigured, startTelegramSession]);

  async function handleMagicLink(event?: FormEvent) {
    event?.preventDefault();
    if (!cloudConfigured || !email.trim()) {
      setStatus('Введите email, чтобы начать марафон.');
      return;
    }

    setIsSending(true);
    const redirectUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    const errorMessage = await requestMagicLink(email.trim(), redirectUrl);
    setIsSending(false);
    setStatus(errorMessage ?? 'Magic link отправлен. Открой письмо и вернись в приложение.');
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

    if (cloudConfigured) {
      await hydrateFromSupabase({ blockUi: false });
      if (useAppStore.getState().profile) {
        return;
      }
    }

    startSession(email.trim() || 'local@author.test');
  }

  async function handleCloudRetry() {
    setIsRetryingCloud(true);
    setStatus('Проверяю облако еще раз...');
    await hydrateFromSupabase({ blockUi: false });

    if (useAppStore.getState().profile) {
      return;
    }

    setIsRetryingCloud(false);
    setStatus('Если облако молчит, можно вернуться к текстам локально.');
  }

  return (
    <main className="auth-screen">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <section className="auth-card glass-panel">
        <p className="eyebrow">Челлендж + эмоция</p>
        <h1>100 постов за 40 дней. Пиши для себя.</h1>
        <h2>
          Дзен-редактор, который лечит писательский блок. Пиши «в стол», закрывай дневную норму и
          собирай уникальные награды за каждую победу над чистым листом.
        </h2>
        
        {isTelegram && !cloudError ? (
           <div className="telegram-auth-status">
              <p>{isHydrating ? 'Связываемся с Telegram...' : 'Вход через Telegram...'}</p>
           </div>
        ) : (
          <form onSubmit={cloudConfigured ? handleMagicLink : handleStartLocal} className="auth-form">
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
        )}

        <div className="auth-secondary">
          <button
            type="button"
            className="ghost-button"
            data-testid="start-local-mode"
            onClick={() => void handleReturnToTexts()}
          >
            Вернуться к текстам
          </button>
          {cloudError && cloudConfigured ? (
            <button
              type="button"
              className="ghost-button"
              data-testid="retry-cloud-hydration"
              onClick={() => void handleCloudRetry()}
              disabled={isRetryingCloud}
            >
              {isRetryingCloud ? 'Проверяю...' : 'Проверить облако еще раз'}
            </button>
          ) : null}
        </div>
        {!cloudConfigured ? (
          <p className="muted">Облачный вход не настроен, тексты будут храниться локально.</p>
        ) : null}
        {cloudError ? <p className="status-line negative">{cloudError}</p> : null}
        {status ? <p className="status-line">{status}</p> : null}
      </section>
    </main>
  );
}
