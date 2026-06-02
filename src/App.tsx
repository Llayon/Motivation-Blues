import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import { Bank } from './components/Bank';
import { ClassicToast } from './components/ClassicToast';
import { Dashboard } from './components/Dashboard';
import { ExportPanel } from './components/ExportPanel';
import { Nav } from './components/Nav';
import { SeasonPass } from './components/SeasonPass';
import { ZenEditor } from './components/ZenEditor';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { useAppStore } from './store/useAppStore';

const CapsuleQueue = lazy(() =>
  import('./components/CapsuleQueue').then((module) => ({ default: module.CapsuleQueue }))
);
const Collection = lazy(() =>
  import('./components/Collection').then((module) => ({ default: module.Collection }))
);

function ActiveView() {
  const activeView = useAppStore((state) => state.activeView);

  switch (activeView) {
    case 'editor':
      return <ZenEditor />;
    case 'bank':
      return <Bank />;
    case 'season':
      return <SeasonPass />;
    case 'capsules':
      return (
        <Suspense fallback={<p className="muted">Готовлю капсулы...</p>}>
          <CapsuleQueue />
        </Suspense>
      );
    case 'collection':
      return (
        <Suspense fallback={<p className="muted">Протираю полку...</p>}>
          <Collection />
        </Suspense>
      );
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
  const profile = useAppStore((state) => state.profile);
  const isHydrating = useAppStore((state) => state.isHydrating);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);

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
    if (!hasPersistedStoreHydrated) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    void hydrateFromSupabase({ blockUi: true });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateFromSupabase({ blockUi: false });
    });

    return () => subscription.unsubscribe();
  }, [hasPersistedStoreHydrated, hydrateFromSupabase]);

  if (!hasPersistedStoreHydrated || isHydrating) {
    return (
      <main className="auth-screen">
        <section className="auth-card glass-panel">
          <p className="eyebrow">Supabase</p>
          <h1>Подключаю облачный сезон...</h1>
          <p className="hero-copy">Проверяю сессию и загружаю банк постов.</p>
        </section>
      </main>
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
        <ActiveView />
      </main>
      <ClassicToast />
    </div>
  );
}
