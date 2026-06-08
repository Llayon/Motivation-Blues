import { afterEach, describe, expect, test, vi } from 'vitest';
import { CRASH_REPORT_STORAGE_KEY } from './crashReport';
import {
  createDiagnosticsSnapshot,
  formatDiagnosticsSnapshot,
  type DiagnosticsContext
} from './diagnostics';

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    })
  };
}

const context: DiagnosticsContext = {
  activeView: 'dashboard',
  cloudConfigured: true,
  cloudError: 'Supabase timeout',
  counts: {
    archivedPosts: 1,
    bankedPosts: 2,
    drafts: 3,
    inventoryItems: 4,
    sealedCapsules: 5,
    totalPosts: 6
  },
  isHydrating: false,
  isTelegramLaunch: true,
  mode: 'cloud',
  profilePresent: true,
  syncStatus: {
    conflictCount: 0,
    failedCount: 1,
    isSyncing: false,
    lastError: 'Network offline',
    pendingCount: 2,
    syncingCount: 0
  }
};

describe('diagnostics snapshot', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('creates a privacy-safe support snapshot with service worker state', async () => {
    vi.stubGlobal('window', {
      innerHeight: 720,
      innerWidth: 390,
      location: {
        href: 'https://llayon.github.io/Motivation-Blues/?debug=1&access_token=secret#refresh_token=secret'
      }
    });
    vi.stubGlobal('navigator', {
      language: 'ru-RU',
      onLine: true,
      serviceWorker: {
        controller: {},
        getRegistration: vi.fn().mockResolvedValue({
          active: { state: 'activated' },
          installing: null,
          waiting: { state: 'installed' }
        })
      },
      userAgent: 'Playwright'
    });
    const localStorage = createLocalStorageMock();
    localStorage.setItem(
      CRASH_REPORT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        id: 'crash-1',
        createdAt: '2026-06-08T12:00:00.000Z',
        route: { activeView: 'editor' },
        error: { message: 'Route failed' }
      })
    );
    vi.stubGlobal('localStorage', localStorage);

    const snapshot = await createDiagnosticsSnapshot(context, new Date('2026-06-08T12:30:00.000Z'));
    const formatted = formatDiagnosticsSnapshot(snapshot);

    expect(snapshot.runtime.href).toBe(
      'https://llayon.github.io/Motivation-Blues/?query=access_token,debug'
    );
    expect(snapshot.serviceWorker).toMatchObject({
      activeState: 'activated',
      controller: true,
      registration: 'registered',
      waitingState: 'installed'
    });
    expect(snapshot.crashReport).toMatchObject({
      activeView: 'editor',
      id: 'crash-1',
      message: 'Route failed',
      present: true
    });
    expect(snapshot.state.counts.bankedPosts).toBe(2);
    expect(snapshot.state.profilePresent).toBe(true);
    expect(formatted).not.toContain('secret');
    expect(formatted).not.toContain('author@example.test');
    expect(formatted).not.toContain('draft body');
  });

  test('degrades when service worker APIs are unavailable', async () => {
    vi.stubGlobal('window', {
      innerHeight: 800,
      innerWidth: 1200,
      location: { href: 'https://app.local/?debug=1' }
    });
    vi.stubGlobal('navigator', {
      language: 'en-US',
      onLine: false,
      userAgent: 'Unit'
    });
    vi.stubGlobal('localStorage', createLocalStorageMock());

    const snapshot = await createDiagnosticsSnapshot(context);

    expect(snapshot.serviceWorker).toMatchObject({
      controller: false,
      registration: 'unavailable',
      supported: false
    });
    expect(snapshot.runtime.online).toBe(false);
    expect(snapshot.crashReport.present).toBe(false);
  });
});
