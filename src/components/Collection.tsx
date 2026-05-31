import { useMemo } from 'react';
import { collectibleItems, rarityLabels } from '../data/items';
import { useAppStore } from '../store/useAppStore';
import { VoxelShowcase } from './VoxelShowcase';

export function Collection() {
  const inventory = useAppStore((state) => state.inventory);
  const grouped = useMemo(
    () =>
      collectibleItems.map((item) => ({
        item,
        count: inventory.filter((entry) => entry.itemId === item.id).length
      })),
    [inventory]
  );

  return (
    <section className="content-panel glass-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Полка</p>
          <h1>Воксельные классики</h1>
        </div>
        <div className="level-chip">{inventory.length} фигурок</div>
      </div>
      <div className="collection-grid">
        {grouped.map(({ item, count }) => (
          <article key={item.id} className={count > 0 ? 'collection-card owned' : 'collection-card'}>
            <VoxelShowcase item={item} mode={count > 0 ? 'figure' : 'locked'} />
            <h2>{item.name}</h2>
            <p>{rarityLabels[item.rarity]}</p>
            <span>{count > 0 ? `x${count}` : 'Не найдена'}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
