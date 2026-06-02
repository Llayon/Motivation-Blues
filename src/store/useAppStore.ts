import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collectibleItems } from '../data/items';
import { createClassicFeedback } from '../data/classicPhrases';
import { CLOUD_HYDRATION_TIMEOUT_MS, withCloudTimeout } from '../lib/cloudHydration';
import { getCrossedMilestones, getDailyGoal, getLocalDateKey, getSeasonDay } from '../lib/season';
import { pickRandom, pickWeightedRarity } from '../lib/random';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import type {
  Capsule,
  ClassicFeedback,
  DailyProgress,
  InventoryItem,
  Post,
  PostInput,
  Rarity,
  UserProfile,
  ViewId
} from '../types';

type AppMode = 'local' | 'cloud';

type HydrateFromSupabaseOptions = {
  blockUi?: boolean;
  timeoutMs?: number;
};

interface AppState {
  activeView: ViewId;
  mode: AppMode;
  cloudConfigured: boolean;
  isHydrating: boolean;
  cloudError: string | null;
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
  requestMagicLink: (email: string, redirectUrl: string) => Promise<string | null>;
  startSession: (email: string) => void;
  signOut: () => Promise<void>;
  saveDraft: (input: PostInput) => Promise<string | null>;
  bankPost: (input: PostInput) => Promise<void>;
  updateBankedPost: (input: PostInput) => Promise<boolean>;
  archivePost: (postId: string) => Promise<void>;
  clearFeedback: () => void;
  openCapsule: (capsuleId: string) => Promise<void>;
  clearReveal: () => void;
}

type DbProfile = {
  id: string;
  created_at: string;
  season_start_at: string;
  timezone: string;
  total_banked_posts: number;
};

type DbPost = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: Post['status'];
  char_count: number;
  word_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  banked_at: string | null;
};

type DbDailyProgress = {
  id: string;
  user_id: string;
  date_key: string;
  season_day: number;
  goal_posts: number;
  banked_count: number;
  goal_capsule_awarded: boolean;
};

type DbCapsule = {
  id: string;
  user_id: string;
  capsule_type: Capsule['capsuleType'];
  status: Capsule['status'];
  trigger_key: string;
  created_from: string;
  acquired_at: string;
  opened_at: string | null;
  item_id: string | null;
};

type DbInventoryItem = {
  id: string;
  user_id: string;
  item_id: string;
  capsule_id: string;
  acquired_at: string;
};

type CloudData = {
  profile: UserProfile;
  posts: Post[];
  dailyProgress: DailyProgress[];
  capsules: Capsule[];
  inventory: InventoryItem[];
};

type CloudHydrationSnapshot =
  | { kind: 'anonymous' }
  | { kind: 'authenticated'; cloudData: CloudData };

let latestHydrationRequestId = 0;

function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))
  ).slice(0, 8);
}

function createPost(userId: string, input: PostInput, status: Post['status']): Post {
  const now = new Date().toISOString();
  const content = input.content.trim();

  return {
    id: input.id ?? crypto.randomUUID(),
    userId,
    title: input.title.trim(),
    content,
    status,
    charCount: content.length,
    wordCount: countWords(content),
    tags: normalizeTags(input.tags),
    createdAt: now,
    updatedAt: now,
    bankedAt: status === 'banked' ? now : undefined
  };
}

function updatePost(existing: Post, input: PostInput, status?: Post['status']): Post {
  const now = new Date().toISOString();
  const content = input.content.trim();
  const nextStatus = status ?? existing.status;

  return {
    ...existing,
    title: input.title.trim(),
    content,
    tags: normalizeTags(input.tags),
    status: nextStatus,
    charCount: content.length,
    wordCount: countWords(content),
    updatedAt: now,
    bankedAt: nextStatus === 'banked' ? (existing.bankedAt ?? now) : existing.bankedAt
  };
}

function buildCapsule(
  userId: string,
  triggerKey: string,
  createdFrom: string,
  capsuleType: Capsule['capsuleType']
): Capsule {
  return {
    id: crypto.randomUUID(),
    userId,
    triggerKey,
    createdFrom,
    capsuleType,
    status: 'sealed',
    acquiredAt: new Date().toISOString()
  };
}

function chooseItemByRarity(rarity: Rarity) {
  const pool = collectibleItems.filter((item) => item.rarity === rarity);
  return pickRandom(pool.length > 0 ? pool : collectibleItems);
}

function mapProfile(row: DbProfile, email: string): UserProfile {
  return {
    id: row.id,
    email,
    createdAt: row.created_at,
    seasonStartAt: row.season_start_at,
    timezone: row.timezone,
    totalBankedPosts: row.total_banked_posts
  };
}

function mapPost(row: DbPost): Post {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    status: row.status,
    charCount: row.char_count,
    wordCount: row.word_count,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    bankedAt: row.banked_at ?? undefined
  };
}

function mapDailyProgress(row: DbDailyProgress): DailyProgress {
  return {
    id: row.id,
    userId: row.user_id,
    dateKey: row.date_key,
    seasonDay: row.season_day,
    goalPosts: row.goal_posts,
    bankedCount: row.banked_count,
    goalCapsuleAwarded: row.goal_capsule_awarded
  };
}

function mapCapsule(row: DbCapsule): Capsule {
  return {
    id: row.id,
    userId: row.user_id,
    capsuleType: row.capsule_type,
    status: row.status,
    triggerKey: row.trigger_key,
    createdFrom: row.created_from,
    acquiredAt: row.acquired_at,
    openedAt: row.opened_at ?? undefined,
    itemId: row.item_id ?? undefined
  };
}

function mapInventoryItem(row: DbInventoryItem): InventoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    itemId: row.item_id,
    capsuleId: row.capsule_id,
    acquiredAt: row.acquired_at
  };
}

function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
}

async function requireCloudSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

async function upsertCloudProfile(userId: string, timezone: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, timezone }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

async function loadCloudData(email: string): Promise<CloudData> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const [profileResult, postsResult, dailyProgressResult, capsulesResult, inventoryResult] =
    await Promise.all([
      supabase.from('profiles').select('*').single<DbProfile>(),
      supabase
        .from('posts')
        .select('*')
        .order('updated_at', { ascending: false })
        .returns<DbPost[]>(),
      supabase
        .from('daily_progress')
        .select('*')
        .order('date_key', { ascending: false })
        .returns<DbDailyProgress[]>(),
      supabase
        .from('capsules')
        .select('*')
        .order('acquired_at', { ascending: false })
        .returns<DbCapsule[]>(),
      supabase
        .from('user_inventory')
        .select('*')
        .order('acquired_at', { ascending: false })
        .returns<DbInventoryItem[]>()
    ]);

  if (profileResult.error) throw profileResult.error;
  if (postsResult.error) throw postsResult.error;
  if (dailyProgressResult.error) throw dailyProgressResult.error;
  if (capsulesResult.error) throw capsulesResult.error;
  if (inventoryResult.error) throw inventoryResult.error;

  return {
    profile: mapProfile(profileResult.data, email),
    posts: (postsResult.data ?? []).map(mapPost),
    dailyProgress: (dailyProgressResult.data ?? []).map(mapDailyProgress),
    capsules: (capsulesResult.data ?? []).map(mapCapsule),
    inventory: (inventoryResult.data ?? []).map(mapInventoryItem)
  };
}

async function loadCloudHydrationSnapshot(): Promise<CloudHydrationSnapshot> {
  const session = await requireCloudSession();
  if (!session?.user) {
    return { kind: 'anonymous' };
  }

  const email = session.user.email ?? 'author@example.com';
  await upsertCloudProfile(session.user.id, getLocalTimezone());
  const cloudData = await loadCloudData(email);

  return { kind: 'authenticated', cloudData };
}

async function saveCloudPost(
  profile: UserProfile,
  posts: Post[],
  input: PostInput,
  forcedStatus?: Post['status']
): Promise<Post> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const existing = input.id ? posts.find((post) => post.id === input.id) : undefined;
  const content = input.content.trim();
  const payload = {
    user_id: profile.id,
    title: input.title.trim(),
    content,
    tags: normalizeTags(input.tags),
    status: forcedStatus ?? (existing?.status === 'banked' ? 'banked' : 'draft'),
    char_count: content.length,
    word_count: countWords(content),
    updated_at: new Date().toISOString()
  };

  const result = existing
    ? await supabase
        .from('posts')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single<DbPost>()
    : await supabase.from('posts').insert(payload).select('*').single<DbPost>();

  if (result.error) {
    throw result.error;
  }

  return mapPost(result.data);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeView: 'dashboard',
      mode: isSupabaseConfigured ? 'cloud' : 'local',
      cloudConfigured: isSupabaseConfigured,
      isHydrating: isSupabaseConfigured,
      cloudError: null,
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

        if (blockUi) {
          set({ isHydrating: true, cloudError: null });
        } else {
          set({ cloudError: null });
        }

        try {
          const snapshot = await withCloudTimeout(loadCloudHydrationSnapshot(), timeoutMs);

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
        } catch (error) {
          if (requestId !== latestHydrationRequestId) {
            return;
          }

          const message = error instanceof Error ? error.message : 'Supabase sync failed.';
          set({ isHydrating: false, cloudError: message });
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
          isHydrating: false
        });
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
          cloudError: null
        });
      },
      saveDraft: async (input) => {
        const { profile, posts, mode } = get();
        if (!profile || input.content.trim().length === 0) {
          return null;
        }

        if (mode === 'cloud' && supabase) {
          try {
            const nextPost = await saveCloudPost(profile, posts, input);
            set({
              posts: posts.some((post) => post.id === nextPost.id)
                ? posts.map((post) => (post.id === nextPost.id ? nextPost : post))
                : [nextPost, ...posts],
              cloudError: null
            });
            return nextPost.id;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Draft save failed.';
            set({ cloudError: message });
            return null;
          }
        }

        const existing = input.id ? posts.find((post) => post.id === input.id) : undefined;
        const nextPost = existing
          ? updatePost(existing, input, existing.status === 'banked' ? 'banked' : 'draft')
          : createPost(profile.id, input, 'draft');

        set({
          posts: existing
            ? posts.map((post) => (post.id === nextPost.id ? nextPost : post))
            : [nextPost, ...posts]
        });

        return nextPost.id;
      },
      bankPost: async (input) => {
        const { profile, posts, dailyProgress, capsules, mode } = get();
        if (!profile || input.content.trim().length === 0) {
          return;
        }

        const existing = input.id ? posts.find((post) => post.id === input.id) : undefined;

        if (mode === 'cloud' && supabase) {
          try {
            const savedPost = await saveCloudPost(profile, posts, input, existing?.status);
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
            set({ cloudError: message });
          }
          return;
        }

        if (existing?.status === 'banked') {
          const updated = updatePost(existing, input, 'banked');
          set({
            posts: posts.map((post) => (post.id === updated.id ? updated : post)),
            feedback: createClassicFeedback(updated.charCount)
          });
          return;
        }

        const previousTotal = profile.totalBankedPosts;
        const nextPost = existing
          ? updatePost(existing, input, 'banked')
          : createPost(profile.id, input, 'banked');
        const nextTotal = Math.min(100, previousTotal + 1);
        const now = new Date();
        const dateKey = getLocalDateKey(now);
        const seasonDay = getSeasonDay(profile.seasonStartAt, now);
        const goalPosts = getDailyGoal(seasonDay);
        const progressId = `${profile.id}:${dateKey}`;
        const existingProgress = dailyProgress.find((progress) => progress.dateKey === dateKey);
        const previousDailyCount = existingProgress?.bankedCount ?? 0;
        const nextDailyCount = previousDailyCount + 1;
        const nextCapsules = [...capsules];
        const existingTriggerKeys = new Set(capsules.map((capsule) => capsule.triggerKey));

        if (
          previousDailyCount < goalPosts &&
          nextDailyCount >= goalPosts &&
          !existingTriggerKeys.has(`daily:${dateKey}`)
        ) {
          nextCapsules.unshift(
            buildCapsule(
              profile.id,
              `daily:${dateKey}`,
              `День ${seasonDay}: дневная норма`,
              'daily'
            )
          );
          existingTriggerKeys.add(`daily:${dateKey}`);
        }

        for (const milestone of getCrossedMilestones(previousTotal, nextTotal)) {
          const triggerKey = `milestone:${milestone}`;
          if (!existingTriggerKeys.has(triggerKey)) {
            nextCapsules.unshift(
              buildCapsule(profile.id, triggerKey, `${milestone} постов в банке`, 'milestone')
            );
          }
        }

        const nextProgress: DailyProgress = {
          id: existingProgress?.id ?? progressId,
          userId: profile.id,
          dateKey,
          seasonDay,
          goalPosts,
          bankedCount: nextDailyCount,
          goalCapsuleAwarded: existingProgress?.goalCapsuleAwarded || nextDailyCount >= goalPosts
        };

        set({
          profile: {
            ...profile,
            totalBankedPosts: nextTotal
          },
          posts: existing
            ? posts.map((post) => (post.id === nextPost.id ? nextPost : post))
            : [nextPost, ...posts],
          dailyProgress: existingProgress
            ? dailyProgress.map((progress) =>
                progress.id === nextProgress.id ? nextProgress : progress
              )
            : [nextProgress, ...dailyProgress],
          capsules: nextCapsules,
          feedback: createClassicFeedback(nextPost.charCount)
        });
      },
      updateBankedPost: async (input) => {
        const { profile, posts, mode } = get();
        if (!profile || !input.id || input.content.trim().length === 0) {
          return false;
        }

        const existing = posts.find((post) => post.id === input.id);
        if (!existing || existing.status !== 'banked') {
          return false;
        }

        if (mode === 'cloud' && supabase) {
          try {
            const updated = await saveCloudPost(profile, posts, input, 'banked');
            set({
              posts: posts.map((post) => (post.id === updated.id ? updated : post)),
              editorTargetPostId: null,
              cloudError: null
            });
            await get().hydrateFromSupabase({ blockUi: false });
            return true;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Banked post update failed.';
            set({ cloudError: message });
            return false;
          }
        }

        const updated = updatePost(existing, input, 'banked');
        set({
          posts: posts.map((post) => (post.id === updated.id ? updated : post)),
          editorTargetPostId: null
        });
        return true;
      },
      archivePost: async (postId) => {
        const { posts, mode } = get();

        if (mode === 'cloud' && supabase) {
          const { error } = await supabase
            .from('posts')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .eq('id', postId);

          if (error) {
            set({ cloudError: error.message });
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
