import type { ViewId } from '../types';

export const CRASH_REPORT_STORAGE_KEY = 'motivation-blues-crash-report';

const MAX_TEXT_LENGTH = 6_000;

type AppMode = 'local' | 'cloud';

export interface CrashReportContext {
  activeView: ViewId;
  mode: AppMode;
  cloudConfigured: boolean;
  cloudError: string | null;
  isTelegramLaunch: boolean;
  syncStatus: {
    pendingCount: number;
    syncingCount: number;
    failedCount: number;
    conflictCount: number;
    lastError: string | null;
  };
}

export interface CrashReport {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  app: {
    name: 'Motivation Blues';
    version: string;
    buildSha: string;
    viteMode: string;
    baseUrl: string;
  };
  route: {
    activeView: ViewId;
  };
  state: {
    mode: AppMode;
    cloudConfigured: boolean;
    cloudError: string | null;
    isTelegramLaunch: boolean;
    syncStatus: CrashReportContext['syncStatus'];
  };
  runtime: {
    href: string;
    online: boolean | null;
    userAgent: string;
    language: string;
    viewport: string;
  };
  error: {
    name: string;
    message: string;
    stack: string | null;
    componentStack: string | null;
  };
}

interface ReactErrorInfoLike {
  componentStack?: string | null;
}

function truncate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.length > MAX_TEXT_LENGTH
    ? `${value.slice(0, MAX_TEXT_LENGTH)}...<truncated>`
    : value;
}

function createCrashReportId(createdAt: string) {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `crash-${createdAt.replace(/[^0-9]/g, '').slice(0, 14)}-${suffix}`;
}

function sanitizeHref(href: string): string {
  try {
    const url = new URL(href);
    const queryKeys = Array.from(url.searchParams.keys()).sort();
    const querySummary = queryKeys.length > 0 ? `?query=${queryKeys.join(',')}` : '';

    return `${url.origin}${url.pathname}${querySummary}`;
  } catch {
    return 'unavailable';
  }
}

function readRuntimeSnapshot(): CrashReport['runtime'] {
  if (typeof window === 'undefined') {
    return {
      href: 'unavailable',
      online: null,
      userAgent: 'unavailable',
      language: 'unavailable',
      viewport: 'unavailable'
    };
  }

  return {
    href: sanitizeHref(window.location.href),
    online: typeof navigator === 'undefined' ? null : navigator.onLine,
    userAgent: typeof navigator === 'undefined' ? 'unavailable' : navigator.userAgent,
    language: typeof navigator === 'undefined' ? 'unavailable' : navigator.language,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  };
}

export function createCrashReport(
  error: Error,
  errorInfo: ReactErrorInfoLike,
  context: CrashReportContext,
  createdAt = new Date()
): CrashReport {
  const timestamp = createdAt.toISOString();

  return {
    schemaVersion: 1,
    id: createCrashReportId(timestamp),
    createdAt: timestamp,
    app: {
      name: 'Motivation Blues',
      version: __APP_VERSION__,
      buildSha: __APP_BUILD_SHA__,
      viteMode: import.meta.env.MODE,
      baseUrl: import.meta.env.BASE_URL
    },
    route: {
      activeView: context.activeView
    },
    state: {
      mode: context.mode,
      cloudConfigured: context.cloudConfigured,
      cloudError: truncate(context.cloudError),
      isTelegramLaunch: context.isTelegramLaunch,
      syncStatus: {
        pendingCount: context.syncStatus.pendingCount,
        syncingCount: context.syncStatus.syncingCount,
        failedCount: context.syncStatus.failedCount,
        conflictCount: context.syncStatus.conflictCount,
        lastError: truncate(context.syncStatus.lastError)
      }
    },
    runtime: readRuntimeSnapshot(),
    error: {
      name: error.name || 'Error',
      message: truncate(error.message) ?? 'Unknown error',
      stack: truncate(error.stack),
      componentStack: truncate(errorInfo.componentStack)
    }
  };
}

export function formatCrashReport(report: CrashReport): string {
  return JSON.stringify(report, null, 2);
}

export function saveCrashReport(report: CrashReport): void {
  try {
    localStorage.setItem(CRASH_REPORT_STORAGE_KEY, formatCrashReport(report));
  } catch {
    // Diagnostics must never make the fallback screen fail.
  }
}

export function readCrashReport(): CrashReport | null {
  try {
    const raw = localStorage.getItem(CRASH_REPORT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CrashReport>;
    return parsed.schemaVersion === 1 && typeof parsed.id === 'string'
      ? (parsed as CrashReport)
      : null;
  } catch {
    return null;
  }
}

export async function copyCrashReport(report: CrashReport): Promise<void> {
  const text = formatCrashReport(report);

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is unavailable.');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Clipboard fallback failed.');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
