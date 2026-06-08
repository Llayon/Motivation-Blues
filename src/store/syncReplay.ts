import type { SyncOperation } from '../lib/syncOutbox';
import { supabase } from '../services/supabase';
import type { Post } from '../types';
import { saveCloudPost } from './cloudData';

async function loadCloudPostStatus(postId: string): Promise<Post['status'] | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('posts')
    .select('status')
    .eq('id', postId)
    .maybeSingle<{ status: Post['status'] }>();

  if (error) {
    throw error;
  }

  return data?.status ?? null;
}

export async function replaySyncOperation(operation: SyncOperation, posts: Post[]): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (operation.type === 'archivePost') {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', operation.payload.postId);

    if (error) {
      throw error;
    }

    return;
  }

  const { profile, input } = operation.payload;

  if (operation.type === 'saveDraft') {
    await saveCloudPost(profile, posts, input, 'draft');
    return;
  }

  if (operation.type === 'updateBankedPost') {
    await saveCloudPost(profile, posts, input, 'banked');
    return;
  }

  const cloudStatus = input.id ? await loadCloudPostStatus(input.id) : null;
  const savedPost = await saveCloudPost(profile, posts, input, cloudStatus ?? 'draft');

  if (cloudStatus === 'banked') {
    return;
  }

  const { error } = await supabase.rpc('bank_post', { post_id: savedPost.id });

  if (error) {
    throw error;
  }
}
