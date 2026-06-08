import { useEffect, useMemo, useState } from 'react';
import { clearCrashReport, copyTextToClipboard } from '../lib/crashReport';
import {
  createDiagnosticsSnapshot,
  formatDiagnosticsSnapshot,
  type DiagnosticsContext,
  type DiagnosticsSnapshot
} from '../lib/diagnostics';
import { hasTelegramLaunchParams, isTelegramEnvironment } from '../lib/telegramApp';
import { useAppStore } from '../store/useAppStore';

interface DiagnosticsHubProps {
  onClose: () => void;
}

function formatBool(value: boolean) {
  return value ? 'да' : 'нет';
}

function formatNullable(value: string | null) {
  return value ?? 'нет';
}

export function DiagnosticsHub({ onClose }: DiagnosticsHubProps) {
  const activeView = useAppStore((state) => state.activeView);
  const capsules = useAppStore((state) => state.capsules);
  const cloudConfigured = useAppStore((state) => state.cloudConfigured);
  const cloudError = useAppStore((state) => state.cloudError);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);
  const inventory = useAppStore((state) => state.inventory);
  const isHydrating = useAppStore((state) => state.isHydrating);
  const mode = useAppStore((state) => state.mode);
  const posts = useAppStore((state) => state.posts);
  const profile = useAppStore((state) => state.profile);
  const syncOutbox = useAppStore((state) => state.syncOutbox);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);
  const [isRefreshingOutbox, setIsRefreshingOutbox] = useState(false);
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot | null>(null);

  const diagnosticsContext = useMemo<DiagnosticsContext>(
    () => ({
      activeView,
      cloudConfigured,
      cloudError,
      counts: {
        archivedPosts: posts.filter((post) => post.status === 'archived').length,
        bankedPosts: posts.filter((post) => post.status === 'banked').length,
        drafts: posts.filter((post) => post.status === 'draft').length,
        inventoryItems: inventory.length,
        sealedCapsules: capsules.filter((capsule) => capsule.status === 'sealed').length,
        totalPosts: posts.length
      },
      isHydrating,
      isTelegramLaunch: isTelegramEnvironment() || hasTelegramLaunchParams(),
      mode,
      profilePresent: !!profile,
      syncStatus: {
        conflictCount: syncStatus.conflictCount,
        failedCount: syncStatus.failedCount,
        isSyncing: syncStatus.isSyncing,
        lastError: syncStatus.lastError,
        pendingCount: syncStatus.pendingCount,
        syncingCount: syncStatus.syncingCount
      }
    }),
    [
      activeView,
      capsules,
      cloudConfigured,
      cloudError,
      inventory,
      isHydrating,
      mode,
      posts,
      profile,
      syncStatus
    ]
  );

  const queuedSyncCount =
    syncStatus.pendingCount +
    syncStatus.syncingCount +
    syncStatus.failedCount +
    syncStatus.conflictCount;

  useEffect(() => {
    let isCancelled = false;

    void createDiagnosticsSnapshot(diagnosticsContext).then((nextSnapshot) => {
      if (!isCancelled) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [diagnosticsContext]);

  async function refreshSnapshot() {
    const nextSnapshot = await createDiagnosticsSnapshot(diagnosticsContext);
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }

  async function handleCopy() {
    const currentSnapshot = snapshot ?? (await refreshSnapshot());

    try {
      await copyTextToClipboard(formatDiagnosticsSnapshot(currentSnapshot));
      setCopyStatus('Диагностика скопирована. Можно отправить разработчику.');
    } catch {
      setCopyStatus('Не удалось скопировать диагностику. Браузер закрыл буфер обмена.');
    }
  }

  async function handleCloudRetry() {
    setIsRefreshingCloud(true);
    setCopyStatus('Проверяю облако...');

    try {
      await hydrateFromSupabase({ blockUi: false });
      setCopyStatus('Проверка облака завершена. Snapshot обновлен.');
    } finally {
      setIsRefreshingCloud(false);
      await refreshSnapshot();
    }
  }

  async function handleOutboxRetry() {
    setIsRefreshingOutbox(true);
    setCopyStatus('Повторяю очередь облака...');

    try {
      await syncOutbox();
      setCopyStatus('Очередь облака проверена. Snapshot обновлен.');
    } finally {
      setIsRefreshingOutbox(false);
      await refreshSnapshot();
    }
  }

  async function handleClearCrashReport() {
    clearCrashReport();
    await refreshSnapshot();
    setCopyStatus('Crash report очищен локально.');
  }

  return (
    <section className="diagnostics-layout glass-panel" data-testid="diagnostics-hub">
      <div className="diagnostics-heading">
        <p className="eyebrow">Support mode</p>
        <h1>Диагностика письменной комнаты</h1>
        <p>
          Этот экран собирает только техническое состояние приложения: сборка, режим, облако,
          Telegram, PWA и очередь синхронизации. Тексты, email и токены сюда не попадают.
        </p>
      </div>

      <div className="hero-actions diagnostics-actions">
        <button className="primary-button" type="button" onClick={() => void handleCopy()}>
          Скопировать диагностику
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => void handleCloudRetry()}
          disabled={!cloudConfigured || isRefreshingCloud}
        >
          {isRefreshingCloud ? 'Проверяю...' : 'Повторить облако'}
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => void handleOutboxRetry()}
          disabled={queuedSyncCount === 0 || isRefreshingOutbox}
        >
          {isRefreshingOutbox ? 'Повторяю...' : 'Повторить очередь'}
        </button>
        <button
          className="plain-button"
          type="button"
          onClick={() => void handleClearCrashReport()}
          disabled={!snapshot?.crashReport.present}
        >
          Очистить crash report
        </button>
        <button className="plain-button" type="button" onClick={onClose}>
          Вернуться
        </button>
      </div>

      {copyStatus ? <p className="status-line">{copyStatus}</p> : null}

      <div className="diagnostics-grid">
        <article className="diagnostics-card">
          <h2>Сборка</h2>
          <dl>
            <div>
              <dt>Version</dt>
              <dd data-testid="diagnostics-version">{snapshot?.app.version ?? '...'}</dd>
            </div>
            <div>
              <dt>Build</dt>
              <dd>{snapshot?.app.buildSha ?? '...'}</dd>
            </div>
            <div>
              <dt>Base path</dt>
              <dd>{snapshot?.app.baseUrl ?? '...'}</dd>
            </div>
          </dl>
        </article>

        <article className="diagnostics-card">
          <h2>Среда</h2>
          <dl>
            <div>
              <dt>Online</dt>
              <dd>{formatBool(!!snapshot?.runtime.online)}</dd>
            </div>
            <div>
              <dt>Telegram</dt>
              <dd data-testid="diagnostics-telegram">
                {formatBool(!!snapshot?.state.isTelegramLaunch)}
              </dd>
            </div>
            <div>
              <dt>Viewport</dt>
              <dd>{snapshot?.runtime.viewport ?? '...'}</dd>
            </div>
          </dl>
        </article>

        <article className="diagnostics-card">
          <h2>Облако</h2>
          <dl>
            <div>
              <dt>Mode</dt>
              <dd data-testid="diagnostics-mode">{snapshot?.state.mode ?? '...'}</dd>
            </div>
            <div>
              <dt>Supabase</dt>
              <dd>{formatBool(!!snapshot?.state.cloudConfigured)}</dd>
            </div>
            <div>
              <dt>Hydrating</dt>
              <dd>{formatBool(!!snapshot?.state.isHydrating)}</dd>
            </div>
            <div>
              <dt>Cloud error</dt>
              <dd>{formatNullable(snapshot?.state.cloudError ?? null)}</dd>
            </div>
          </dl>
        </article>

        <article className="diagnostics-card">
          <h2>Очередь</h2>
          <dl>
            <div>
              <dt>Pending</dt>
              <dd>{snapshot?.state.syncStatus.pendingCount ?? 0}</dd>
            </div>
            <div>
              <dt>Syncing</dt>
              <dd>{snapshot?.state.syncStatus.syncingCount ?? 0}</dd>
            </div>
            <div>
              <dt>Failed</dt>
              <dd>{snapshot?.state.syncStatus.failedCount ?? 0}</dd>
            </div>
            <div>
              <dt>Last error</dt>
              <dd>{formatNullable(snapshot?.state.syncStatus.lastError ?? null)}</dd>
            </div>
          </dl>
        </article>

        <article className="diagnostics-card">
          <h2>PWA</h2>
          <dl>
            <div>
              <dt>Supported</dt>
              <dd>{formatBool(!!snapshot?.serviceWorker.supported)}</dd>
            </div>
            <div>
              <dt>Registration</dt>
              <dd data-testid="diagnostics-service-worker">
                {snapshot?.serviceWorker.registration ?? '...'}
              </dd>
            </div>
            <div>
              <dt>Controller</dt>
              <dd>{formatBool(!!snapshot?.serviceWorker.controller)}</dd>
            </div>
          </dl>
        </article>

        <article className="diagnostics-card">
          <h2>Crash</h2>
          <dl>
            <div>
              <dt>Present</dt>
              <dd>{formatBool(!!snapshot?.crashReport.present)}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd data-testid="diagnostics-crash-id">
                {formatNullable(snapshot?.crashReport.id ?? null)}
              </dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{formatNullable(snapshot?.crashReport.message ?? null)}</dd>
            </div>
          </dl>
        </article>
      </div>

      <pre className="diagnostics-preview" data-testid="diagnostics-preview">
        {snapshot ? formatDiagnosticsSnapshot(snapshot) : 'Собираю диагностику...'}
      </pre>
    </section>
  );
}
