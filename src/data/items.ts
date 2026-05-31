import type { CollectibleItem, Rarity } from '../types';

export const rarityLabels: Record<Rarity, string> = {
  common: 'Обычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная'
};

export const rarityWeights: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 5
};

export const collectibleItems: CollectibleItem[] = [
  {
    id: 'pushkin-bro-pen',
    name: 'Пушкин-братан с пером',
    classicId: 'pushkin',
    rarity: 'common',
    modelUrl: '/models/pushkin-bro-pen.gltf',
    thumbnailUrl: '/thumbs/pushkin-bro-pen.png',
    palette: { primary: '#10131a', secondary: '#f1d1a7', accent: '#47c2ff' }
  },
  {
    id: 'chekhov-dry-notebook',
    name: 'Чехов с блокнотом',
    classicId: 'chekhov',
    rarity: 'common',
    modelUrl: '/models/chekhov-dry-notebook.gltf',
    thumbnailUrl: '/thumbs/chekhov-dry-notebook.png',
    palette: { primary: '#594936', secondary: '#f4d9b7', accent: '#8fb4ff' }
  },
  {
    id: 'tolstoy-tea-mug',
    name: 'Толстой с кружкой чая',
    classicId: 'tolstoy',
    rarity: 'rare',
    modelUrl: '/models/tolstoy-tea-mug.gltf',
    thumbnailUrl: '/thumbs/tolstoy-tea-mug.png',
    palette: { primary: '#7a6a56', secondary: '#f0c8a0', accent: '#c7f464' }
  },
  {
    id: 'gogol-shinel-ghost',
    name: 'Гоголь в подозрительной шинели',
    classicId: 'gogol',
    rarity: 'rare',
    modelUrl: '/models/gogol-shinel-ghost.gltf',
    thumbnailUrl: '/thumbs/gogol-shinel-ghost.png',
    palette: { primary: '#202332', secondary: '#f1d2b6', accent: '#b8ffec' }
  },
  {
    id: 'dostoevsky-inner-abyss',
    name: 'Достоевский и внутренняя бездна',
    classicId: 'dostoevsky',
    rarity: 'epic',
    modelUrl: '/models/dostoevsky-inner-abyss.gltf',
    thumbnailUrl: '/thumbs/dostoevsky-inner-abyss.png',
    palette: { primary: '#3b2435', secondary: '#e8b98e', accent: '#ff7a90' }
  },
  {
    id: 'mayakovsky-megaphone',
    name: 'Маяковский с мегафоном',
    classicId: 'mayakovsky',
    rarity: 'epic',
    modelUrl: '/models/mayakovsky-megaphone.gltf',
    thumbnailUrl: '/thumbs/mayakovsky-megaphone.png',
    palette: { primary: '#f3cf3f', secondary: '#f3b287', accent: '#ff4d4d' }
  },
  {
    id: 'bulgakov-master-cat',
    name: 'Булгаков с котом',
    classicId: 'bulgakov',
    rarity: 'legendary',
    modelUrl: '/models/bulgakov-master-cat.gltf',
    thumbnailUrl: '/thumbs/bulgakov-master-cat.png',
    palette: { primary: '#1d1a27', secondary: '#f0c6a3', accent: '#ffd86b' }
  }
];
