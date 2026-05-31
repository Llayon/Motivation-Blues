import { describe, expect, it } from 'vitest';
import {
  getCrossedMilestones,
  getDailyGoal,
  getLevel,
  getPlannedTotalByDay,
  getSeasonDay
} from './season';

describe('season rules', () => {
  it('uses the 2/3/2 daily goal schedule', () => {
    expect(getDailyGoal(1)).toBe(2);
    expect(getDailyGoal(10)).toBe(2);
    expect(getDailyGoal(11)).toBe(3);
    expect(getDailyGoal(30)).toBe(3);
    expect(getDailyGoal(31)).toBe(2);
    expect(getDailyGoal(40)).toBe(2);
  });

  it('plans exactly 100 posts across 40 days', () => {
    expect(getPlannedTotalByDay(40)).toBe(100);
  });

  it('calculates season day from local calendar dates', () => {
    const start = new Date(2026, 4, 1, 12).toISOString();
    const now = new Date(2026, 4, 10, 9);

    expect(getSeasonDay(start, now)).toBe(10);
  });

  it('levels every five banked posts', () => {
    expect(getLevel(0)).toBe(0);
    expect(getLevel(4)).toBe(0);
    expect(getLevel(5)).toBe(1);
    expect(getLevel(100)).toBe(20);
  });

  it('detects crossed milestones without duplicates', () => {
    expect(getCrossedMilestones(9, 10)).toEqual([10]);
    expect(getCrossedMilestones(10, 11)).toEqual([]);
    expect(getCrossedMilestones(24, 51)).toEqual([25, 50]);
  });
});
