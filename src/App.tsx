import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { ClassicToast } from './components/ClassicToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Nav } from './components/Nav';
import { hasTelegramLaunchParams, isTelegramEnvironment } from './lib/telegramApp';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { useAppStore } from './store/useAppStore';

const loadDashboard = () =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard }));
const loadZenEditor = () =>
  import('./components/ZenEditor').then((module) => ({ default: module.ZenEditor }));
const loadBank = () => import('./components/Bank').then((module) => ({ default: module.Bank }));

const Dashboard = lazy(loadDashboard);
const ZenEditor = lazy(loadZenEditor);
const Bank = lazy(loadBank);
const SeasonPass = lazy(() =>
  import('./components/SeasonPass').then((module) => ({ default: module.SeasonPass }))
);
const ExportPanel = lazy(() =>
  import('./components/ExportPanel').then((module) => ({ default: module.ExportPanel }))
);
const CapsuleQueue = lazy(() =>
  import('./components/CapsuleQueue').then((module) => ({ default: module.CapsuleQueue }))
);
const Collection = lazy(() =>
  import('./components/Collection').then((module) => ({ default: module.Collection }))
);
const DiagnosticsHub = lazy(() =>
  import('./components/DiagnosticsHub').then((module) => ({ default: module.DiagnosticsHub }))
);

function preloadCoreWritingViews() {
  void Promise.allSettled([loadDashboard(), loadZenEditor(), loadBank()]);
}

function hasDiagnosticsRoute() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
}

function ActiveView() {
  const activeView = useAppStore((state) => state.activeView);

  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('__simulateRouteError')
  ) {
    throw new Error('Simulated active view crash.');
  }

  switch (activeView) {
    case 'editor':
      return <ZenEditor />;
    case 'bank':
      return <Bank />;
    case 'season':
      return <SeasonPass />;
    case 'capsules':
      return <CapsuleQueue />;
    case 'collection':
      return <Collection />;
    case 'export':
      return <ExportPanel />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const [hasPersistedStoreHydrated, setHasPersistedStoreHydrated] = useState(
    useAppStore.persist.hasHydrated()
  );
  const [isDiagnosticsRoute, setIsDiagnosticsRoute] = useState(hasDiagnosticsRoute);
  const activeView = useAppStore((state) => state.activeView);
  const cloudConfigured = useAppStore((state) => state.cloudConfigured);
  const cloudError = useAppStore((state) => state.cloudError);
  const mode = useAppStore((state) => state.mode);
  const profile = useAppStore((state) => state.profile);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);
  const refreshSyncStatus = useAppStore((state) => state.refreshSyncStatus);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const syncOutbox = useAppStore((state) => state.syncOutbox);
  const isTelegramLaunch = isTelegramEnvironment() || hasTelegramLaunchParams();
  const diagnosticsContext = {
    activeView,
    cloudConfigured,
    cloudError,
    isTelegramLaunch,
    mode,
    syncStatus: {
      pendingCount: syncStatus.pendingCount,
      syncingCount: syncStatus.syncingCount,
      failedCount: syncStatus.failedCount,
      conflictCount: syncStatus.conflictCount,
      lastError: syncStatus.lastError
    }
  };

  function handleRouteErrorReset() {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('__simulateRouteError');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    setActiveView('dashboard');
  }

  function handleCloseDiagnostics() {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('debug');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    setIsDiagnosticsRoute(false);
  }

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setHasPersistedStoreHydrated(true);
    });

    if (useAppStore.persist.hasHydrated()) {
      setHasPersistedStoreHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    function handlePopState() {
      setIsDiagnosticsRoute(hasDiagnosticsRoute());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!hasPersistedStoreHydrated || isDiagnosticsRoute) {
      return;
    }

    const timeoutId = window.setTimeout(preloadCoreWritingViews, 0);
    return () => window.clearTimeout(timeoutId);
  }, [hasPersistedStoreHydrated, isDiagnosticsRoute]);

  useEffect(() => {
    if (!hasPersistedStoreHydrated) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    if (!isTelegramLaunch) {
      void hydrateFromSupabase({ blockUi: false });
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only hydrate on actual auth state transitions to avoid loops
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        (event === 'INITIAL_SESSION' && session)
      ) {
        void hydrateFromSupabase({ blockUi: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [hasPersistedStoreHydrated, hydrateFromSupabase, isTelegramLaunch]);

  useEffect(() => {
    if (!hasPersistedStoreHydrated) {
      return;
    }

    void refreshSyncStatus();

    function handleOnline() {
      void syncOutbox();
    }

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasPersistedStoreHydrated, refreshSyncStatus, syncOutbox]);

  if (!hasPersistedStoreHydrated) {
    return (
      <main className="auth-screen">
        <section className="auth-card glass-panel">
          <p className="eyebrow">Motivation Blues</p>
          <h1>Открываю письменную комнату...</h1>
          <p className="hero-copy">Поднимаю локальные тексты. Облако подключится фоном.</p>
        </section>
      </main>
    );
  }

  if (isDiagnosticsRoute) {
    return (
      <div className="app-shell">
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <main className="app-main">
          <ErrorBoundary
            key="diagnostics"
            diagnosticsContext={diagnosticsContext}
            onReset={handleCloseDiagnostics}
          >
            <Suspense fallback={<p className="muted">Собираю диагностику...</p>}>
              <DiagnosticsHub onClose={handleCloseDiagnostics} />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  if (!profile) {
    return <AuthGate />;
  }

  return (
    <div className="app-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <Nav />
      <main className="app-main">
        <ErrorBoundary
          key={activeView}
          diagnosticsContext={diagnosticsContext}
          onReset={handleRouteErrorReset}
        >
          <Suspense fallback={<p className="muted">Открываю раздел...</p>}>
            <ActiveView />
          </Suspense>
        </ErrorBoundary>
      </main>
      <ClassicToast />
    </div>
  );
}
