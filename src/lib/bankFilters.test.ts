import { describe, expect, it } from 'vitest';
import { filterBankedPosts, getTagCounts } from './bankFilters';
import type { Post } from '../types';

function makePost(id: string, title: string, content: string, tags: string[]): Post {
  return {
    id,
    userId: 'user-1',
    title,
    content,
    tags,
    status: 'banked',
    charCount: content.length,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    bankedAt: '2026-01-01T00:00:00.000Z'
  };
}

const posts = [
  makePost('1', 'Product note', 'Writing about launch mechanics', ['product', 'launch']),
  makePost('2', 'Personal note', 'Daily reflection', ['personal']),
  makePost('3', 'Product story', 'Launch reflection', ['product', 'personal'])
];

describe('bank filters', () => {
  it('counts tags across posts and sorts by count then name', () => {
    expect(getTagCounts(posts)).toEqual([
      { tag: 'personal', count: 2 },
      { tag: 'product', count: 2 },
      { tag: 'launch', count: 1 }
    ]);
  });

  it('filters posts by AND tag semantics', () => {
    expect(filterBankedPosts(posts, '', ['product', 'personal']).map((post) => post.id)).toEqual([
      '3'
    ]);
  });

  it('searches title, content, and tags', () => {
    expect(filterBankedPosts(posts, 'daily', []).map((post) => post.id)).toEqual(['2']);
    expect(filterBankedPosts(posts, 'launch', []).map((post) => post.id)).toEqual(['1', '3']);
  });
});
