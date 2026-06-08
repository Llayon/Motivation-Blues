import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  clearSyncOutboxForTests,
  createSyncOperation,
  enqueueSyncOperation,
  getOutboxSummary,
  listReplayableSyncOperations,
  markFailed,
  markSyncing,
  markSynced
} from './syncOutbox';
import type { UserProfile } from '../types';

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

const profile: UserProfile = {
  id: 'user-1',
  email: 'author@example.test',
  createdAt: '2026-06-01T00:00:00.000Z',
  seasonStartAt: '2026-06-01T00:00:00.000Z',
  timezone: 'Europe/Moscow',
  totalBankedPosts: 0
};

describe('sync outbox fallback store', () => {
  afterEach(async () => {
    await clearSyncOutboxForTests();
    vi.unstubAllGlobals();
  });

  test('queues and lists replayable operations in creation order', async () => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('window', {});

    const first = createSyncOperation('saveDraft', 'post-1', {
      profile,
      input: { id: 'post-1', title: 'First', content: 'One', tags: [] }
    });
    await new Promise((resolve) => setTimeout(resolve, 1));
    const second = createSyncOperation('bankPost', 'post-2', {
      profile,
      input: { id: 'post-2', title: 'Second', content: 'Two', tags: ['sync'] }
    });

    await enqueueSyncOperation(second);
    await enqueueSyncOperation(first);

    await expect(listReplayableSyncOperations()).resolves.toEqual([first, second]);
    await expect(getOutboxSummary()).resolves.toMatchObject({
      pendingCount: 2,
      failedCount: 0
    });
  });

  test('tracks syncing, failed, and synced states', async () => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('window', {});

    const operation = createSyncOperation('updateBankedPost', 'post-1', {
      profile,
      input: { id: 'post-1', title: 'Updated', content: 'Text', tags: [] }
    });

    await enqueueSyncOperation(operation);
    await markSyncing(operation.id);
    await expect(getOutboxSummary()).resolves.toMatchObject({ syncingCount: 1 });
    await expect(listReplayableSyncOperations()).resolves.toHaveLength(1);

    await markFailed(operation.id, 'Network offline');
    await expect(getOutboxSummary()).resolves.toMatchObject({
      failedCount: 1,
      lastError: 'Network offline'
    });

    await markSynced(operation.id);
    await expect(getOutboxSummary()).resolves.toMatchObject({
      pendingCount: 0,
      failedCount: 0
    });
  });
});
