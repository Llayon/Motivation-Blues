const SEASON_TOTAL_DAYS = 40;
const SEASON_TOTAL_POSTS = 100;
export const POSTS_PER_LEVEL = 5;
export const SEASON_LEVELS = SEASON_TOTAL_POSTS / POSTS_PER_LEVEL;
const MILESTONES = [10, 25, 50, 75, 100] as const;

function clampSeasonDay(day: number): number {
  return Math.min(SEASON_TOTAL_DAYS, Math.max(1, day));
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getSeasonDay(seasonStartAt: string, now = new Date()): number {
  const start = new Date(seasonStartAt);
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  return clampSeasonDay(diffDays + 1);
}

export function getDailyGoal(seasonDay: number): number {
  const day = clampSeasonDay(seasonDay);

  if (day <= 10) {
    return 2;
  }

  if (day <= 30) {
    return 3;
  }

  return 2;
}

export function getLevel(totalBankedPosts: number): number {
  return Math.min(SEASON_LEVELS, Math.floor(totalBankedPosts / POSTS_PER_LEVEL));
}

export function getNextLevelTarget(totalBankedPosts: number): number {
  const nextLevel = Math.min(SEASON_LEVELS, getLevel(totalBankedPosts) + 1);
  return Math.min(SEASON_TOTAL_POSTS, nextLevel * POSTS_PER_LEVEL);
}

export function getProgressPercent(totalBankedPosts: number): number {
  return Math.min(100, Math.max(0, (totalBankedPosts / SEASON_TOTAL_POSTS) * 100));
}

export function getCrossedMilestones(previousTotal: number, nextTotal: number): number[] {
  return MILESTONES.filter((milestone) => previousTotal < milestone && nextTotal >= milestone);
}

export function getPlannedTotalByDay(seasonDay: number): number {
  let total = 0;
  for (let day = 1; day <= clampSeasonDay(seasonDay); day += 1) {
    total += getDailyGoal(day);
  }

  return Math.min(SEASON_TOTAL_POSTS, total);
}
