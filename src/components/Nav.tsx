import type { ViewId } from '../types';
import { useAppStore } from '../store/useAppStore';

const navItems: Array<{ id: ViewId; label: string }> = [
  { id: 'dashboard', label: 'Кабинет' },
  { id: 'editor', label: 'Редактор' },
  { id: 'bank', label: 'Банк' },
  { id: 'season', label: 'Сезон' },
  { id: 'capsules', label: 'Капсулы' },
  { id: 'collection', label: 'Полка' },
  { id: 'export', label: 'Экспорт' }
];

export function Nav() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const profile = useAppStore((state) => state.profile);
  const signOut = useAppStore((state) => state.signOut);
  const mode = useAppStore((state) => state.mode);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const syncOutbox = useAppStore((state) => state.syncOutbox);
  const queuedSyncCount =
    syncStatus.pendingCount +
    syncStatus.syncingCount +
    syncStatus.failedCount +
    syncStatus.conflictCount;
  const hasSyncProblems = syncStatus.failedCount > 0 || syncStatus.conflictCount > 0;
  const shouldShowSyncStatus = mode === 'cloud' && queuedSyncCount > 0;
  let syncLabel = `Ждет облако: ${queuedSyncCount}`;

  if (hasSyncProblems) {
    syncLabel = `Повторить облако: ${queuedSyncCount}`;
  } else if (syncStatus.isSyncing || syncStatus.syncingCount > 0) {
    syncLabel = `Синхронизирую: ${queuedSyncCount}`;
  }

  return (
    <header className="top-nav glass-panel">
      <button className="brand-mark" onClick={() => setActiveView('dashboard')} type="button">
        <span>100</span>
        <small>постов</small>
      </button>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? 'active' : ''}
            onClick={() => setActiveView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="nav-profile">
        <span>
          {mode === 'cloud' ? 'Cloud' : 'Local'} · {profile?.email}
        </span>
        {shouldShowSyncStatus ? (
          <button
            className={`sync-pill ${hasSyncProblems ? 'sync-pill-problem' : ''}`}
            data-testid="sync-status"
            disabled={syncStatus.isSyncing}
            type="button"
            onClick={() => void syncOutbox()}
          >
            {syncLabel}
          </button>
        ) : null}
        <button type="button" onClick={() => void signOut()}>
          Выйти
        </button>
      </div>
    </header>
  );
}
