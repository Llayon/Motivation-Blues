import type { Rarity, TextLengthBucket } from '../types';
import { rarityWeights } from '../data/items';

export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty collection.');
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function pickWeightedRarity(): Rarity {
  const total = Object.values(rarityWeights).reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [rarity, weight] of Object.entries(rarityWeights) as Array<[Rarity, number]>) {
    roll -= weight;
    if (roll <= 0) {
      return rarity;
    }
  }

  return 'common';
}

export function getTextLengthBucket(charCount: number): TextLengthBucket {
  if (charCount < 500) {
    return 'short';
  }

  if (charCount < 1800) {
    return 'medium';
  }

  return 'long';
}
