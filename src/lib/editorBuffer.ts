export interface EditorBufferRecord {
  userId: string;
  postId?: string;
  title: string;
  content: string;
  tagsInput: string;
  updatedAt: string;
}

const DB_NAME = 'motivation-blues-editor-buffer';
const DB_VERSION = 1;
const STORE_NAME = 'active-editor-buffers';
const FALLBACK_PREFIX = 'motivation-blues-editor-buffer:';

let dbPromise: Promise<IDBDatabase> | null = null;
const writeChains = new Map<string, Promise<void>>();

function getFallbackKey(userId: string): string {
  return `${FALLBACK_PREFIX}${userId}`;
}

function supportsIndexedDb(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openBufferDb(): Promise<IDBDatabase> {
  if (!supportsIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is not available.'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open editor buffer DB.'));
    request.onblocked = () => reject(new Error('Editor buffer DB upgrade is blocked.'));
  });

  return dbPromise;
}

async function runStoreOperation<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openBufferDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);
    let result: T;

    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error ?? new Error('Editor buffer request failed.'));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Editor buffer transaction failed.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Editor buffer transaction aborted.'));
  });
}

function enqueueWrite(userId: string, task: () => Promise<void>): Promise<void> {
  const previous = writeChains.get(userId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  writeChains.set(userId, next);

  next.finally(() => {
    if (writeChains.get(userId) === next) {
      writeChains.delete(userId);
    }
  });

  return next;
}

function saveFallback(record: EditorBufferRecord): void {
  localStorage.setItem(getFallbackKey(record.userId), JSON.stringify(record));
}

function loadFallback(userId: string): EditorBufferRecord | null {
  const raw = localStorage.getItem(getFallbackKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as EditorBufferRecord;
  } catch {
    localStorage.removeItem(getFallbackKey(userId));
    return null;
  }
}

function clearFallback(userId: string): void {
  localStorage.removeItem(getFallbackKey(userId));
}

export function saveEditorBuffer(record: EditorBufferRecord): Promise<void> {
  return enqueueWrite(record.userId, async () => {
    try {
      await runStoreOperation('readwrite', (store) => store.put(record));
    } catch {
      saveFallback(record);
    }
  });
}

export async function loadEditorBuffer(userId: string): Promise<EditorBufferRecord | null> {
  await (writeChains.get(userId) ?? Promise.resolve()).catch(() => undefined);

  try {
    const record = await runStoreOperation<EditorBufferRecord | undefined>('readonly', (store) =>
      store.get(userId)
    );
    return record ?? loadFallback(userId);
  } catch {
    return loadFallback(userId);
  }
}

export function clearEditorBuffer(userId: string): Promise<void> {
  return enqueueWrite(userId, async () => {
    try {
      await runStoreOperation('readwrite', (store) => store.delete(userId));
    } finally {
      clearFallback(userId);
    }
  });
}
