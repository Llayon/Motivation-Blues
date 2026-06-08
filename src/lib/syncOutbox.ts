import type { PostInput, UserProfile } from '../types';
import {
  clearStoredSyncOperations,
  deleteStoredSyncOperation,
  listStoredSyncOperations,
  putStoredSyncOperation
} from './syncOutboxStorage';

export type SyncOperationType = 'saveDraft' | 'bankPost' | 'updateBankedPost' | 'archivePost';
type SyncOperationStatus = 'pending' | 'syncing' | 'failed' | 'conflict' | 'synced';

type PostSyncPayload = {
  profile: UserProfile;
  input: PostInput;
};

type ArchiveSyncPayload = {
  profile: UserProfile;
  postId: string;
};

export type SyncOperation =
  | {
      id: string;
      type: Exclude<SyncOperationType, 'archivePost'>;
      entityId: string;
      payload: PostSyncPayload;
      status: SyncOperationStatus;
      attempts: number;
      createdAt: string;
      updatedAt: string;
      lastError?: string;
      idempotencyKey: string;
    }
  | {
      id: string;
      type: 'archivePost';
      entityId: string;
      payload: ArchiveSyncPayload;
      status: SyncOperationStatus;
      attempts: number;
      createdAt: string;
      updatedAt: string;
      lastError?: string;
      idempotencyKey: string;
    };

export type SyncOutboxSummary = {
  pendingCount: number;
  syncingCount: number;
  failedCount: number;
  conflictCount: number;
  lastError: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function sortOperationsByCreation(a: SyncOperation, b: SyncOperation): number {
  const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
  return byCreatedAt === 0 ? a.id.localeCompare(b.id) : byCreatedAt;
}

export function createSyncOperation(
  type: Exclude<SyncOperationType, 'archivePost'>,
  entityId: string,
  payload: PostSyncPayload
): SyncOperation;
export function createSyncOperation(
  type: 'archivePost',
  entityId: string,
  payload: ArchiveSyncPayload
): SyncOperation;
export function createSyncOperation(
  type: SyncOperationType,
  entityId: string,
  payload: PostSyncPayload | ArchiveSyncPayload
): SyncOperation {
  const createdAt = nowIso();

  return {
    id: crypto.randomUUID(),
    type,
    entityId,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt,
    updatedAt: createdAt,
    idempotencyKey: `${type}:${entityId}:${createdAt}`
  } as SyncOperation;
}

export async function enqueueSyncOperation(operation: SyncOperation): Promise<void> {
  await putStoredSyncOperation(operation);
}

async function listSyncOperations(): Promise<SyncOperation[]> {
  return (await listStoredSyncOperations()).sort(sortOperationsByCreation);
}

export async function listReplayableSyncOperations(): Promise<SyncOperation[]> {
  return (await listSyncOperations()).filter(
    (operation) =>
      operation.status === 'pending' ||
      operation.status === 'failed' ||
      operation.status === 'syncing'
  );
}

async function updateOperation(
  operationId: string,
  updater: (operation: SyncOperation) => SyncOperation
): Promise<void> {
  const operations = await listSyncOperations();
  const operation = operations.find((entry) => entry.id === operationId);

  if (!operation) {
    return;
  }

  const next = updater(operation);
  await putStoredSyncOperation(next);
}

export function markSyncing(operationId: string): Promise<void> {
  return updateOperation(operationId, (operation) => ({
    ...operation,
    status: 'syncing',
    updatedAt: nowIso(),
    lastError: undefined
  }));
}

export async function markSynced(operationId: string): Promise<void> {
  await deleteStoredSyncOperation(operationId);
}

export function markFailed(operationId: string, lastError: string): Promise<void> {
  return updateOperation(operationId, (operation) => ({
    ...operation,
    status: 'failed',
    attempts: operation.attempts + 1,
    updatedAt: nowIso(),
    lastError
  }));
}

export async function getOutboxSummary(): Promise<SyncOutboxSummary> {
  const operations = await listSyncOperations();
  const lastProblem = [...operations]
    .reverse()
    .find((operation) => operation.lastError && operation.status !== 'synced');

  return {
    pendingCount: operations.filter((operation) => operation.status === 'pending').length,
    syncingCount: operations.filter((operation) => operation.status === 'syncing').length,
    failedCount: operations.filter((operation) => operation.status === 'failed').length,
    conflictCount: operations.filter((operation) => operation.status === 'conflict').length,
    lastError: lastProblem?.lastError ?? null
  };
}

export async function clearSyncOutboxForTests(): Promise<void> {
  await clearStoredSyncOperations();
}
