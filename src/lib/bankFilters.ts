import type { Post } from '../types';

export interface TagCount {
  tag: string;
  count: number;
}

export function getTagCounts(posts: Post[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag));
}

export function filterBankedPosts(posts: Post[], query: string, selectedTags: string[]): Post[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedTags = selectedTags.map((tag) => tag.toLowerCase());

  return posts.filter((post) => {
    const matchesTags = normalizedTags.every((tag) => post.tags.includes(tag));
    if (!matchesTags) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [post.title, post.content, post.tags.join(' ')].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    );
  });
}
