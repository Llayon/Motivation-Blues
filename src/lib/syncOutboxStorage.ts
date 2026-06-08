import type { SyncOperation } from './syncOutbox';

const DB_NAME = 'motivation-blues-sync-outbox';
const DB_VERSION = 1;
const STORE_NAME = 'sync-operations';
const FALLBACK_KEY = 'motivation-blues-sync-outbox';

let dbPromise: Promise<IDBDatabase> | null = null;

function supportsIndexedDb(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function getFallbackStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function openOutboxDb(): Promise<IDBDatabase> {
  if (!supportsIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is not available.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open sync outbox DB.'));
      request.onblocked = () => reject(new Error('Sync outbox DB upgrade is blocked.'));
    });
  }

  return dbPromise;
}

async function runStoreOperation<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openOutboxDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    let result: T;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error ?? new Error('Sync outbox request failed.'));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Sync outbox transaction failed.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Sync outbox transaction aborted.'));
  });
}

function loadFallback(): SyncOperation[] {
  const storage = getFallbackStorage();
  const raw = storage?.getItem(FALLBACK_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SyncOperation[];
  } catch {
    storage?.removeItem(FALLBACK_KEY);
    return [];
  }
}

function saveFallback(operations: SyncOperation[]) {
  getFallbackStorage()?.setItem(FALLBACK_KEY, JSON.stringify(operations));
}

function mergeOperations(primary: SyncOperation[], fallback: SyncOperation[]): SyncOperation[] {
  const byId = new Map(primary.map((operation) => [operation.id, operation]));
  fallback.forEach((operation) => byId.set(operation.id, operation));
  return Array.from(byId.values());
}

async function listPrimaryStore(): Promise<SyncOperation[]> {
  return runStoreOperation<SyncOperation[]>('readonly', (store) => store.getAll());
}

async function putPrimaryStore(operation: SyncOperation): Promise<void> {
  await runStoreOperation('readwrite', (store) => store.put(operation));
}

async function deletePrimaryStore(operationId: string): Promise<void> {
  await runStoreOperation('readwrite', (store) => store.delete(operationId));
}

export async function listStoredSyncOperations(): Promise<SyncOperation[]> {
  const fallback = loadFallback();

  try {
    return mergeOperations(await listPrimaryStore(), fallback);
  } catch {
    return fallback;
  }
}

export async function putStoredSyncOperation(operation: SyncOperation): Promise<void> {
  try {
    await putPrimaryStore(operation);
    saveFallback(loadFallback().filter((entry) => entry.id !== operation.id));
  } catch {
    const operations = loadFallback().filter((entry) => entry.id !== operation.id);
    saveFallback([...operations, operation]);
  }
}

export async function deleteStoredSyncOperation(operationId: string): Promise<void> {
  try {
    await deletePrimaryStore(operationId);
  } catch {
    // Fallback-only environments, including Vitest without IndexedDB, still need deletion.
  }

  try {
    saveFallback(loadFallback().filter((operation) => operation.id !== operationId));
  } catch {
    // localStorage can be unavailable in restrictive browser modes.
  }
}

export async function clearStoredSyncOperations(): Promise<void> {
  try {
    const operations = await listPrimaryStore();
    await Promise.all(operations.map((operation) => deletePrimaryStore(operation.id)));
  } catch {
    // Ignore missing or blocked IndexedDB and clear whatever fallback storage exists.
  }

  try {
    saveFallback([]);
  } catch {
    // localStorage can be unavailable in restrictive browser modes.
  }
}
