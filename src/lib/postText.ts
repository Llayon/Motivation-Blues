export function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))
  ).slice(0, 8);
}
