import { createClassicFeedback } from '../data/classicPhrases';
import { collectibleItems } from '../data/items';
import { countWords, normalizeTags } from '../lib/postText';
import { pickRandom } from '../lib/random';
import { getCrossedMilestones, getDailyGoal, getLocalDateKey, getSeasonDay } from '../lib/season';
import type {
  Capsule,
  ClassicFeedback,
  DailyProgress,
  Post,
  PostInput,
  Rarity,
  UserProfile
} from '../types';

export function ensureInputId(input: PostInput): PostInput {
  return {
    ...input,
    id: input.id ?? crypto.randomUUID()
  };
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

export function updatePost(existing: Post, input: PostInput, status?: Post['status']): Post {
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

export function chooseItemByRarity(rarity: Rarity) {
  const pool = collectibleItems.filter((item) => item.rarity === rarity);
  return pickRandom(pool.length > 0 ? pool : collectibleItems);
}

export function buildLocalDraftState(
  profile: UserProfile,
  posts: Post[],
  input: PostInput
): { nextPost: Post; posts: Post[] } {
  const existing = input.id ? posts.find((post) => post.id === input.id) : undefined;
  const nextPost = existing
    ? updatePost(existing, input, existing.status === 'banked' ? 'banked' : 'draft')
    : createPost(profile.id, input, 'draft');

  return {
    nextPost,
    posts: existing
      ? posts.map((post) => (post.id === nextPost.id ? nextPost : post))
      : [nextPost, ...posts]
  };
}

export function buildLocalBankedState(
  profile: UserProfile,
  posts: Post[],
  dailyProgress: DailyProgress[],
  capsules: Capsule[],
  input: PostInput
): {
  profile: UserProfile;
  posts: Post[];
  dailyProgress: DailyProgress[];
  capsules: Capsule[];
  feedback: ClassicFeedback;
} {
  const existing = input.id ? posts.find((post) => post.id === input.id) : undefined;

  if (existing?.status === 'banked') {
    const updated = updatePost(existing, input, 'banked');
    return {
      profile,
      posts: posts.map((post) => (post.id === updated.id ? updated : post)),
      dailyProgress,
      capsules,
      feedback: createClassicFeedback(updated.charCount)
    };
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
      buildCapsule(profile.id, `daily:${dateKey}`, `День ${seasonDay}: дневная норма`, 'daily')
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

  return {
    profile: {
      ...profile,
      totalBankedPosts: nextTotal
    },
    posts: existing
      ? posts.map((post) => (post.id === nextPost.id ? nextPost : post))
      : [nextPost, ...posts],
    dailyProgress: existingProgress
      ? dailyProgress.map((progress) => (progress.id === nextProgress.id ? nextProgress : progress))
      : [nextProgress, ...dailyProgress],
    capsules: nextCapsules,
    feedback: createClassicFeedback(nextPost.charCount)
  };
}
