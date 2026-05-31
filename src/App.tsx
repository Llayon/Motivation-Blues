import { useEffect } from 'react';
import { AuthGate } from './components/AuthGate';
import { Bank } from './components/Bank';
import { CapsuleQueue } from './components/CapsuleQueue';
import { ClassicToast } from './components/ClassicToast';
import { Collection } from './components/Collection';
import { Dashboard } from './components/Dashboard';
import { ExportPanel } from './components/ExportPanel';
import { Nav } from './components/Nav';
import { SeasonPass } from './components/SeasonPass';
import { ZenEditor } from './components/ZenEditor';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { useAppStore } from './store/useAppStore';

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
  const profile = useAppStore((state) => state.profile);
  const isHydrating = useAppStore((state) => state.isHydrating);
  const hydrateFromSupabase = useAppStore((state) => state.hydrateFromSupabase);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    void hydrateFromSupabase();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void hydrateFromSupabase();
    });

    return () => subscription.unsubscribe();
  }, [hydrateFromSupabase]);

  if (isHydrating) {
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
