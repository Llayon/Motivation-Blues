import type { Post } from '../types';

export function formatPostsForExport(posts: Post[]): string {
  return posts
    .filter((post) => post.status === 'banked')
    .sort((left, right) => {
      const leftDate = left.bankedAt ?? left.updatedAt;
      const rightDate = right.bankedAt ?? right.updatedAt;
      return new Date(leftDate).getTime() - new Date(rightDate).getTime();
    })
    .map((post, index) => {
      const title = post.title.trim() || `Пост ${index + 1}`;
      const tags = post.tags.length > 0 ? `\nТеги: ${post.tags.join(', ')}` : '';
      return `--- Пост ${index + 1}: ${title} ---${tags}\n\n${post.content.trim()}`;
    })
    .join('\n\n');
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
