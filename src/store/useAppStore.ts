import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClassicFeedback } from '../data/classicPhrases';
import { getLocalTimezone, loadCloudHydrationSnapshot, saveCloudPost } from './cloudData';
import { CLOUD_HYDRATION_TIMEOUT_MS, withCloudTimeout } from '../lib/cloudHydration';
import { pickWeightedRarity } from '../lib/random';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import {
  createSyncOperation,
  enqueueSyncOperation,
  getOutboxSummary,
  listReplayableSyncOperations,
  markFailed,
  markSyncing,
  markSynced,
  type SyncOutboxSummary
} from '../lib/syncOutbox';
import {
  buildLocalBankedState,
  buildLocalDraftState,
  chooseItemByRarity,
  ensureInputId,
  updatePost
} from './localPostState';
import { replaySyncOperation } from './syncReplay';
import type {
  Capsule,
  ClassicFeedback,
  DailyProgress,
  InventoryItem,
  Post,
  PostInput,
  UserProfile,
  ViewId
} from '../types';

type AppMode = 'local' | 'cloud';

type HydrateFromSupabaseOptions = {
  blockUi?: boolean;
  timeoutMs?: number;
  syncPending?: boolean;
};

type SyncStatus = SyncOutboxSummary & {
  isSyncing: boolean;
};

interface AppState {
  activeView: ViewId;
  mode: AppMode;
  cloudConfigured: boolean;
  isHydrating: boolean;
  cloudError: string | null;
  syncStatus: SyncStatus;
  profile: UserProfile | null;
  posts: Post[];
  dailyProgress: DailyProgress[];
  capsules: Capsule[];
  inventory: InventoryItem[];
  feedback: ClassicFeedback | null;
  latestRevealItemId: string | null;
  editorTargetPostId: string | null;
  setActiveView: (view: ViewId) => void;
  openPostInEditor: (postId: string) => void;
  clearEditorTarget: () => void;
  hydrateFromSupabase: (options?: HydrateFromSupabaseOptions) => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  syncOutbox: () => Promise<void>;
  requestMagicLink: (email: string, redirectUrl: string) => Promise<string | null>;
  startSession: (email: string) => void;
  startTelegramSession: (initData: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveDraft: (input: PostInput) => Promise<string | null>;
  bankPost: (input: PostInput) => Promise<void>;
  updateBankedPost: (input: PostInput) => Promise<boolean>;
  archivePost: (postId: string) => Promise<void>;
  clearFeedback: () => void;
  openCapsule: (capsuleId: string) => Promise<void>;
  clearReveal: () => void;
}

let latestHydrationRequestId = 0;
let isSyncRunnerActive = false;

const EMPTY_SYNC_STATUS: SyncStatus = {
  pendingCount: 0,
  syncingCount: 0,
  failedCount: 0,
  conflictCount: 0,
  lastError: null,
  isSyncing: false
};

function getSyncWaitMessage() {
  return 'Сохранено локально. Облако догонит, когда связь вернется.';
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeView: 'dashboard',
      mode: isSupabaseConfigured ? 'cloud' : 'local',
      cloudConfigured: isSupabaseConfigured,
      isHydrating: isSupabaseConfigured,
      cloudError: null,
      syncStatus: EMPTY_SYNC_STATUS,
      profile: null,
      posts: [],
      dailyProgress: [],
      capsules: [],
      inventory: [],
      feedback: null,
      latestRevealItemId: null,
      editorTargetPostId: null,
      setActiveView: (view) => set({ activeView: view }),
      openPostInEditor: (postId) =>
        set({
          editorTargetPostId: postId,
          activeView: 'editor'
        }),
      clearEditorTarget: () => set({ editorTargetPostId: null }),
      hydrateFromSupabase: async (options = {}) => {
        const requestId = ++latestHydrationRequestId;
        const blockUi = options.blockUi ?? true;
        const timeoutMs = options.timeoutMs ?? CLOUD_HYDRATION_TIMEOUT_MS;

        if (!supabase) {
          set({ isHydrating: false, mode: 'local', cloudError: null });
          return;
        }

        // Only block the UI if requested AND we're not already hydrating
        if (blockUi) {
          set({ isHydrating: true, cloudError: null });
        } else {
          set({ cloudError: null });
        }

        try {
          const snapshot = await withCloudTimeout(loadCloudHydrationSnapshot(), timeoutMs);

          // If a newer request has started, this one's results are stale.
          // However, we MUST ensure isHydrating becomes false if no other
          // blocking request is active. To simplify, we only let the LATEST
          // request decide the final state of isHydrating.
          if (requestId !== latestHydrationRequestId) {
            return;
          }

          if (snapshot.kind === 'anonymous') {
            const current = get();
            if (current.mode === 'local' && current.profile) {
              set({
                isHydrating: false,
                mode: 'local',
                cloudError: null
              });
              return;
            }

            set({
              isHydrating: false,
              profile: null,
              posts: [],
              dailyProgress: [],
              capsules: [],
              inventory: []
            });
            return;
          }

          set({
            ...snapshot.cloudData,
            isHydrating: false,
            mode: 'cloud',
            cloudError: null
          });

          if (options.syncPending !== false) {
            void get().syncOutbox();
          }
        } catch (error) {
          // Even if we're not the latest request, if we hit a timeout or error,
          // we should consider if we need to unblock the UI.
          // But the cleanest way is still to let the latest one win.
          if (requestId !== latestHydrationRequestId) {
            return;
          }

          const message = error instanceof Error ? error.message : 'Supabase sync failed.';
          set({ isHydrating: false, cloudError: message });
        }
      },
      refreshSyncStatus: async () => {
        const summary = await getOutboxSummary();
        set({
          syncStatus: {
            ...summary,
            isSyncing: isSyncRunnerActive
          }
        });
      },
      syncOutbox: async () => {
        if (isSyncRunnerActive) {
          return;
        }

        if (!supabase) {
          await get().refreshSyncStatus();
          return;
        }

        isSyncRunnerActive = true;
        const initialSummary = await getOutboxSummary();
        set({
          syncStatus: {
            ...initialSummary,
            isSyncing: true
          }
        });

        let didSyncAny = false;

        try {
          const operations = await listReplayableSyncOperations();

          for (const operation of operations) {
            await markSyncing(operation.id);
            await get().refreshSyncStatus();

            try {
              await replaySyncOperation(operation, get().posts);
              await markSynced(operation.id);
              didSyncAny = true;
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Cloud sync operation failed.';
              await markFailed(operation.id, message);
            }
          }
        } finally {
          isSyncRunnerActive = false;
          const summary = await getOutboxSummary();
          set({
            syncStatus: {
              ...summary,
              isSyncing: false
            }
          });
        }

        if (didSyncAny) {
          await get().hydrateFromSupabase({ blockUi: false, syncPending: false });
        }
      },
      requestMagicLink: async (email, redirectUrl) => {
        if (!supabase) {
          return 'Облачный вход не настроен.';
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        return error?.message ?? null;
      },
      startSession: (email) => {
        const now = new Date().toISOString();

        set({
          mode: 'local',
          profile: {
            id: crypto.randomUUID(),
            email,
            createdAt: now,
            seasonStartAt: now,
            timezone: getLocalTimezone(),
            totalBankedPosts: 0
          },
          posts: [],
          dailyProgress: [],
          capsules: [],
          inventory: [],
          editorTargetPostId: null,
          activeView: 'dashboard',
          cloudError: null,
          syncStatus: EMPTY_SYNC_STATUS,
          isHydrating: false
        });
      },
      startTelegramSession: async (initData) => {
        if (!supabase) return;
        set({ isHydrating: true, cloudError: null });

        try {
          // 1. Ask Edge Function to validate initData and give us credentials
          // Use the cloud timeout for this call as well
          const { data, error: fnError } = await withCloudTimeout(
            supabase.functions.invoke('telegram-auth', {
              body: { initData }
            })
          );

          if (fnError || !data || data.error) {
            throw new Error(
              data?.error || fnError?.message || 'Failed to authenticate via Telegram'
            );
          }

          // 2. Log in with the provided credentials
          const { error: signInError } = await withCloudTimeout(
            supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password
            })
          );

          if (signInError) throw signInError;

          // 3. Hydrate state
          await get().hydrateFromSupabase();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Telegram auth failed.';
          set({ isHydrating: false, cloudError: message });
        }
      },
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }

        set({
          activeView: 'dashboard',
          mode: isSupabaseConfigured ? 'cloud' : 'local',
          profile: null,
          posts: [],
          dailyProgress: [],
          capsules: [],
          inventory: [],
          feedback: null,
          latestRevealItemId: null,
          editorTargetPostId: null,
          cloudError: null,
          syncStatus: EMPTY_SYNC_STATUS
        });
      },
      saveDraft: async (input) => {
        const { profile, posts, mode } = get();
        if (!profile || input.content.trim().length === 0) {
          return null;
        }

        const stableInput = ensureInputId(input);

        if (mode === 'cloud' && supabase) {
          try {
            const nextPost = await saveCloudPost(profile, posts, stableInput);
            set({
              posts: posts.some((post) => post.id === nextPost.id)
                ? posts.map((post) => (post.id === nextPost.id ? nextPost : post))
                : [nextPost, ...posts],
              cloudError: null
            });
            return nextPost.id;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Draft save failed.';
            const localDraft = buildLocalDraftState(profile, posts, stableInput);
            await enqueueSyncOperation(
              createSyncOperation('saveDraft', stableInput.id!, {
                profile,
                input: stableInput
              })
            );
            const summary = await getOutboxSummary();
            set({
              posts: localDraft.posts,
              cloudError: `${getSyncWaitMessage()} Последняя ошибка: ${message}`,
              syncStatus: {
                ...summary,
                isSyncing: isSyncRunnerActive
              }
            });
            return localDraft.nextPost.id;
          }
        }

        const localDraft = buildLocalDraftState(profile, posts, stableInput);

        set({
          posts: localDraft.posts
        });

        return localDraft.nextPost.id;
      },
      bankPost: async (input) => {
        const { profile, posts, dailyProgress, capsules, mode } = get();
        if (!profile || input.content.trim().length === 0) {
          return;
        }

        const stableInput = ensureInputId(input);
        const existing = stableInput.id
          ? posts.find((post) => post.id === stableInput.id)
          : undefined;

        if (mode === 'cloud' && supabase) {
          try {
            const savedPost = await saveCloudPost(profile, posts, stableInput, existing?.status);
            if (existing?.status !== 'banked') {
              const { error } = await supabase.rpc('bank_post', { post_id: savedPost.id });
              if (error) {
                throw error;
              }
            }

            await get().hydrateFromSupabase({ blockUi: false });
            set({
              feedback: createClassicFeedback(savedPost.charCount),
              cloudError: null
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Bank post failed.';
            const localBanked = buildLocalBankedState(
              profile,
              posts,
              dailyProgress,
              capsules,
              stableInput
            );
            await enqueueSyncOperation(
              createSyncOperation('bankPost', stableInput.id!, {
                profile,
                input: stableInput
              })
            );
            const summary = await getOutboxSummary();
            set({
              ...localBanked,
              cloudError: `${getSyncWaitMessage()} Последняя ошибка: ${message}`,
              syncStatus: {
                ...summary,
                isSyncing: isSyncRunnerActive
              }
            });
          }
          return;
        }

        set(buildLocalBankedState(profile, posts, dailyProgress, capsules, stableInput));
      },
      updateBankedPost: async (input) => {
        const { profile, posts, mode } = get();
        if (!profile || !input.id || input.content.trim().length === 0) {
          return false;
        }

        const stableInput = ensureInputId(input);
        const existing = posts.find((post) => post.id === stableInput.id);
        if (!existing || existing.status !== 'banked') {
          return false;
        }

        if (mode === 'cloud' && supabase) {
          try {
            const updated = await saveCloudPost(profile, posts, stableInput, 'banked');
            set({
              posts: posts.map((post) => (post.id === updated.id ? updated : post)),
              editorTargetPostId: null,
              cloudError: null
            });
            await get().hydrateFromSupabase({ blockUi: false });
            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Banked post update failed.';
            const updated = updatePost(existing, stableInput, 'banked');
            await enqueueSyncOperation(
              createSyncOperation('updateBankedPost', stableInput.id!, {
                profile,
                input: stableInput
              })
            );
            const summary = await getOutboxSummary();
            set({
              posts: posts.map((post) => (post.id === updated.id ? updated : post)),
              editorTargetPostId: null,
              cloudError: `${getSyncWaitMessage()} Последняя ошибка: ${message}`,
              syncStatus: {
                ...summary,
                isSyncing: isSyncRunnerActive
              }
            });
            return true;
          }
        }

        const updated = updatePost(existing, stableInput, 'banked');
        set({
          posts: posts.map((post) => (post.id === updated.id ? updated : post)),
          editorTargetPostId: null
        });
        return true;
      },
      archivePost: async (postId) => {
        const { profile, posts, mode } = get();

        if (mode === 'cloud' && supabase) {
          const { error } = await supabase
            .from('posts')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', postId);

          if (error) {
            if (profile) {
              await enqueueSyncOperation(
                createSyncOperation('archivePost', postId, {
                  profile,
                  postId
                })
              );
            }
            const summary = await getOutboxSummary();
            set({
              posts: posts.map((post) =>
                post.id === postId
                  ? { ...post, status: 'archived', updatedAt: new Date().toISOString() }
                  : post
              ),
              cloudError: `${getSyncWaitMessage()} Последняя ошибка: ${error.message}`,
              syncStatus: {
                ...summary,
                isSyncing: isSyncRunnerActive
              }
            });
            return;
          }

          await get().hydrateFromSupabase({ blockUi: false });
          return;
        }

        set({
          posts: posts.map((post) =>
            post.id === postId
              ? { ...post, status: 'archived', updatedAt: new Date().toISOString() }
              : post
          )
        });
      },
      clearFeedback: () => set({ feedback: null }),
      openCapsule: async (capsuleId) => {
        const { profile, capsules, inventory, mode } = get();
        if (!profile) {
          return;
        }

        const capsule = capsules.find((item) => item.id === capsuleId);
        if (!capsule || capsule.status !== 'sealed') {
          return;
        }

        if (mode === 'cloud' && supabase) {
          try {
            const { data, error } = await supabase.rpc('open_capsule', {
              capsule_id: capsuleId
            });
            if (error) {
              throw error;
            }

            await get().hydrateFromSupabase({ blockUi: false });
            set({
              latestRevealItemId:
                typeof data === 'object' && data && 'item_id' in data
                  ? String(data.item_id)
                  : (capsule.itemId ?? null),
              cloudError: null
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Open capsule failed.';
            set({ cloudError: message });
          }
          return;
        }

        const rarity = pickWeightedRarity();
        const item = chooseItemByRarity(rarity);
        const acquiredAt = new Date().toISOString();
        const inventoryItem: InventoryItem = {
          id: crypto.randomUUID(),
          userId: profile.id,
          itemId: item.id,
          capsuleId: capsule.id,
          acquiredAt
        };

        set({
          capsules: capsules.map((entry) =>
            entry.id === capsuleId
              ? {
                  ...entry,
                  status: 'opened',
                  openedAt: acquiredAt,
                  itemId: item.id
                }
              : entry
          ),
          inventory: [inventoryItem, ...inventory],
          latestRevealItemId: item.id
        });
      },
      clearReveal: () => set({ latestRevealItemId: null })
    }),
    {
      name: 'post-season-storage',
      version: 2,
      partialize: (state) => ({
        activeView: state.activeView,
        mode: state.mode,
        profile: state.mode === 'local' ? state.profile : null,
        posts: state.mode === 'local' ? state.posts : [],
        dailyProgress: state.mode === 'local' ? state.dailyProgress : [],
        capsules: state.mode === 'local' ? state.capsules : [],
        inventory: state.mode === 'local' ? state.inventory : [],
        editorTargetPostId: state.mode === 'local' ? state.editorTargetPostId : null
      })
    }
  )
);
