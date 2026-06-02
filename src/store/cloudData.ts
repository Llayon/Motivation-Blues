import { supabase } from '../services/supabase';
import { countWords, normalizeTags } from '../lib/postText';
import type { Capsule, DailyProgress, InventoryItem, Post, PostInput, UserProfile } from '../types';

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

export type CloudHydrationSnapshot =
  | { kind: 'anonymous' }
  | { kind: 'authenticated'; cloudData: CloudData };

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

export function getLocalTimezone(): string {
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

export async function loadCloudHydrationSnapshot(): Promise<CloudHydrationSnapshot> {
  const session = await requireCloudSession();
  if (!session?.user) {
    return { kind: 'anonymous' };
  }

  const email = session.user.email ?? 'author@example.com';
  await upsertCloudProfile(session.user.id, getLocalTimezone());
  const cloudData = await loadCloudData(email);

  return { kind: 'authenticated', cloudData };
}

export async function saveCloudPost(
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
