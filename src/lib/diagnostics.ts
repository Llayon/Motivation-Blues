import { readCrashReport, sanitizeHref } from './crashReport';
import type { ViewId } from '../types';

const MAX_TEXT_LENGTH = 2_000;

type AppMode = 'local' | 'cloud';

export interface DiagnosticsContext {
  activeView: ViewId;
  cloudConfigured: boolean;
  cloudError: string | null;
  isHydrating: boolean;
  isTelegramLaunch: boolean;
  mode: AppMode;
  profilePresent: boolean;
  counts: {
    archivedPosts: number;
    bankedPosts: number;
    drafts: number;
    inventoryItems: number;
    sealedCapsules: number;
    totalPosts: number;
  };
  syncStatus: {
    pendingCount: number;
    syncingCount: number;
    failedCount: number;
    conflictCount: number;
    isSyncing: boolean;
    lastError: string | null;
  };
}

export interface DiagnosticsSnapshot {
  schemaVersion: 1;
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
    debugRoute: true;
  };
  state: {
    mode: AppMode;
    cloudConfigured: boolean;
    cloudError: string | null;
    isHydrating: boolean;
    isTelegramLaunch: boolean;
    profilePresent: boolean;
    counts: DiagnosticsContext['counts'];
    syncStatus: DiagnosticsContext['syncStatus'];
  };
  runtime: {
    href: string;
    online: boolean | null;
    userAgent: string;
    language: string;
    viewport: string;
  };
  serviceWorker: {
    supported: boolean;
    controller: boolean;
    registration: 'registered' | 'missing' | 'error' | 'unavailable';
    activeState: string | null;
    waitingState: string | null;
    installingState: string | null;
    error: string | null;
  };
  crashReport: {
    present: boolean;
    id: string | null;
    createdAt: string | null;
    activeView: ViewId | null;
    message: string | null;
  };
}

function truncate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.length > MAX_TEXT_LENGTH
    ? `${value.slice(0, MAX_TEXT_LENGTH)}...<truncated>`
    : value;
}

function readRuntimeSnapshot(): DiagnosticsSnapshot['runtime'] {
  if (typeof window === 'undefined') {
    return {
      href: 'unavailable',
      language: 'unavailable',
      online: null,
      userAgent: 'unavailable',
      viewport: 'unavailable'
    };
  }

  return {
    href: sanitizeHref(window.location.href),
    language: typeof navigator === 'undefined' ? 'unavailable' : navigator.language,
    online: typeof navigator === 'undefined' ? null : navigator.onLine,
    userAgent: typeof navigator === 'undefined' ? 'unavailable' : navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  };
}

async function readServiceWorkerStatus(): Promise<DiagnosticsSnapshot['serviceWorker']> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      activeState: null,
      controller: false,
      error: null,
      installingState: null,
      registration: 'unavailable',
      supported: false,
      waitingState: null
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    return {
      activeState: registration?.active?.state ?? null,
      controller: !!navigator.serviceWorker.controller,
      error: null,
      installingState: registration?.installing?.state ?? null,
      registration: registration ? 'registered' : 'missing',
      supported: true,
      waitingState: registration?.waiting?.state ?? null
    };
  } catch (error) {
    return {
      activeState: null,
      controller: !!navigator.serviceWorker.controller,
      error: truncate(error instanceof Error ? error.message : 'Unknown service worker error'),
      installingState: null,
      registration: 'error',
      supported: true,
      waitingState: null
    };
  }
}

function readCrashReportSummary(): DiagnosticsSnapshot['crashReport'] {
  const report = readCrashReport();

  if (!report) {
    return {
      activeView: null,
      createdAt: null,
      id: null,
      message: null,
      present: false
    };
  }

  return {
    activeView: report.route?.activeView ?? null,
    createdAt: report.createdAt ?? null,
    id: report.id,
    message: truncate(report.error?.message),
    present: true
  };
}

export async function createDiagnosticsSnapshot(
  context: DiagnosticsContext,
  createdAt = new Date()
): Promise<DiagnosticsSnapshot> {
  const serviceWorker = await readServiceWorkerStatus();

  return {
    schemaVersion: 1,
    createdAt: createdAt.toISOString(),
    app: {
      baseUrl: import.meta.env.BASE_URL,
      buildSha: __APP_BUILD_SHA__,
      name: 'Motivation Blues',
      version: __APP_VERSION__,
      viteMode: import.meta.env.MODE
    },
    route: {
      activeView: context.activeView,
      debugRoute: true
    },
    state: {
      cloudConfigured: context.cloudConfigured,
      cloudError: truncate(context.cloudError),
      counts: context.counts,
      isHydrating: context.isHydrating,
      isTelegramLaunch: context.isTelegramLaunch,
      mode: context.mode,
      profilePresent: context.profilePresent,
      syncStatus: {
        conflictCount: context.syncStatus.conflictCount,
        failedCount: context.syncStatus.failedCount,
        isSyncing: context.syncStatus.isSyncing,
        lastError: truncate(context.syncStatus.lastError),
        pendingCount: context.syncStatus.pendingCount,
        syncingCount: context.syncStatus.syncingCount
      }
    },
    runtime: readRuntimeSnapshot(),
    serviceWorker,
    crashReport: readCrashReportSummary()
  };
}

export function formatDiagnosticsSnapshot(snapshot: DiagnosticsSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
