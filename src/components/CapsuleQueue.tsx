import { collectibleItems, rarityLabels } from '../data/items';
import { useAppStore } from '../store/useAppStore';
import { VoxelShowcase } from './VoxelShowcase';

export function CapsuleQueue() {
  const capsules = useAppStore((state) => state.capsules);
  const openCapsule = useAppStore((state) => state.openCapsule);
  const latestRevealItemId = useAppStore((state) => state.latestRevealItemId);
  const clearReveal = useAppStore((state) => state.clearReveal);
  const sealedCapsules = capsules.filter((capsule) => capsule.status === 'sealed');
  const openedCapsules = capsules.filter((capsule) => capsule.status === 'opened');
  const revealedItem = collectibleItems.find((item) => item.id === latestRevealItemId) ?? null;

  return (
    <section className="capsule-layout">
      <article className="content-panel glass-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Очередь капсул</p>
            <h1>Открывай награды только когда готов отвлечься</h1>
          </div>
          <div className="level-chip">{sealedCapsules.length} закрыто</div>
        </div>
        {sealedCapsules.length === 0 ? (
          <p className="empty-state">
            Закрой дневную норму или milestone, и здесь появится матовая капсула вдохновения.
          </p>
        ) : (
          <div className="capsule-grid">
            {sealedCapsules.map((capsule) => (
              <article key={capsule.id} className="capsule-card" data-testid="sealed-capsule">
                <div className="capsule-orb">
                  <span />
                </div>
                <h2>{capsule.capsuleType === 'daily' ? 'Капсула дня' : 'Milestone-амфора'}</h2>
                <p>{capsule.createdFrom}</p>
                <button
                  className="primary-button"
                  data-testid="open-capsule"
                  type="button"
                  onClick={() => openCapsule(capsule.id)}
                >
                  Открыть
                </button>
              </article>
            ))}
          </div>
        )}
      </article>

      <aside className="unboxing-panel glass-panel">
        <p className="eyebrow">Анбоксинг</p>
        {revealedItem ? (
          <>
            <VoxelShowcase item={revealedItem} mode="reveal" />
            <h2 data-testid="revealed-item">{revealedItem.name}</h2>
            <p>{rarityLabels[revealedItem.rarity]} фигурка добавлена на полку.</p>
            <button className="ghost-button" type="button" onClick={clearReveal}>
              Убрать фокус
            </button>
          </>
        ) : (
          <>
            <VoxelShowcase mode="sealed" />
            <h2>Свет внутри сферы</h2>
            <p>Ритуал открытия запускается здесь, отдельно от редактора.</p>
          </>
        )}
        <div className="opened-history">
          <span>Открыто всего: {openedCapsules.length}</span>
        </div>
      </aside>
    </section>
  );
}
