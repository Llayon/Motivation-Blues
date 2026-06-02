export type ViewId =
  | 'dashboard'
  | 'editor'
  | 'bank'
  | 'season'
  | 'capsules'
  | 'collection'
  | 'export';

type PostStatus = 'draft' | 'banked' | 'archived';
type CapsuleStatus = 'sealed' | 'opened';
type CapsuleType = 'daily' | 'milestone';
export type ClassicId =
  | 'pushkin'
  | 'tolstoy'
  | 'dostoevsky'
  | 'gogol'
  | 'chekhov'
  | 'mayakovsky'
  | 'bulgakov';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type TextLengthBucket = 'short' | 'medium' | 'long';

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  seasonStartAt: string;
  timezone: string;
  totalBankedPosts: number;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: PostStatus;
  charCount: number;
  wordCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  bankedAt?: string;
}

export interface DailyProgress {
  id: string;
  userId: string;
  dateKey: string;
  seasonDay: number;
  goalPosts: number;
  bankedCount: number;
  goalCapsuleAwarded: boolean;
}

export interface Capsule {
  id: string;
  userId: string;
  capsuleType: CapsuleType;
  status: CapsuleStatus;
  triggerKey: string;
  createdFrom: string;
  acquiredAt: string;
  openedAt?: string;
  itemId?: string;
}

export interface CollectibleItem {
  id: string;
  name: string;
  classicId: ClassicId;
  rarity: Rarity;
  modelUrl: string;
  thumbnailUrl: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  capsuleId: string;
  acquiredAt: string;
}

export interface ClassicFeedback {
  id: string;
  classicId: ClassicId;
  classicName: string;
  text: string;
  createdAt: string;
}

export interface PostInput {
  id?: string;
  title: string;
  content: string;
  tags: string[];
}
