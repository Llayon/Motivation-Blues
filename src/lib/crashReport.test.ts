import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  copyCrashReport,
  createCrashReport,
  CRASH_REPORT_STORAGE_KEY,
  formatCrashReport,
  readCrashReport,
  saveCrashReport,
  type CrashReportContext
} from './crashReport';

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

const context: CrashReportContext = {
  activeView: 'editor',
  cloudConfigured: true,
  cloudError: null,
  isTelegramLaunch: false,
  mode: 'cloud',
  syncStatus: {
    pendingCount: 1,
    syncingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    lastError: null
  }
};

describe('crash report diagnostics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('creates a local-only crash report with route and runtime metadata', () => {
    vi.stubGlobal('window', {
      innerHeight: 844,
      innerWidth: 390,
      location: {
        href: 'https://llayon.github.io/Motivation-Blues/?access_token=secret&view=editor#refresh_token=secret'
      }
    });
    vi.stubGlobal('navigator', {
      language: 'ru-RU',
      onLine: false,
      userAgent: 'Playwright Mobile'
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => 'fixed-crash-id'
    });

    const report = createCrashReport(
      new Error('Route failed'),
      { componentStack: 'at ActiveView' },
      context,
      new Date('2026-06-08T10:00:00.000Z')
    );

    expect(report.id).toBe('crash-20260608100000-fixed-crash-id');
    expect(report.route.activeView).toBe('editor');
    expect(report.state.mode).toBe('cloud');
    expect(report.state.syncStatus.pendingCount).toBe(1);
    expect(report.runtime).toMatchObject({
      href: 'https://llayon.github.io/Motivation-Blues/?query=access_token,view',
      online: false,
      userAgent: 'Playwright Mobile',
      viewport: '390x844'
    });
    expect(formatCrashReport(report)).not.toContain('secret');
    expect(report.error).toMatchObject({
      name: 'Error',
      message: 'Route failed',
      componentStack: 'at ActiveView'
    });
    expect(report.app.version).toBeTruthy();
    expect(report.app.buildSha).toBeTruthy();
  });

  test('saves, reads, and formats the latest crash report', () => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);

    const report = createCrashReport(
      new Error('Saved locally'),
      { componentStack: 'at ErrorBoundary' },
      context,
      new Date('2026-06-08T11:00:00.000Z')
    );

    saveCrashReport(report);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      CRASH_REPORT_STORAGE_KEY,
      formatCrashReport(report)
    );
    expect(readCrashReport()).toMatchObject({
      id: report.id,
      error: { message: 'Saved locally' },
      route: { activeView: 'editor' }
    });
  });

  test('returns null instead of throwing for malformed stored reports', () => {
    const localStorage = createLocalStorageMock();
    localStorage.setItem(CRASH_REPORT_STORAGE_KEY, '{broken');
    vi.stubGlobal('localStorage', localStorage);

    expect(readCrashReport()).toBeNull();
  });

  test('copies a formatted report through the async clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText }
    });

    const report = createCrashReport(new Error('Copy me'), { componentStack: null }, context);
    await copyCrashReport(report);

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0]?.[0]).toContain('"message": "Copy me"');
  });
});
