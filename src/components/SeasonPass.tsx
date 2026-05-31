import {
  POSTS_PER_LEVEL,
  SEASON_LEVELS,
  getLevel,
  getNextLevelTarget,
  getProgressPercent
} from '../lib/season';
import { useAppStore } from '../store/useAppStore';

export function SeasonPass() {
  const totalBankedPosts = useAppStore((state) => state.profile?.totalBankedPosts ?? 0);
  const currentLevel = getLevel(totalBankedPosts);
  const nextTarget = getNextLevelTarget(totalBankedPosts);
  const levels = Array.from({ length: SEASON_LEVELS }, (_, index) => {
    const level = index + 1;
    const target = level * POSTS_PER_LEVEL;
    return { level, target, unlocked: totalBankedPosts >= target };
  });

  return (
    <section className="content-panel glass-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Season Pass</p>
          <h1>Путь к 100 постам</h1>
        </div>
        <div className="level-chip">Уровень {currentLevel}/20</div>
      </div>
      <div className="season-summary">
        <div>
          <strong>{totalBankedPosts}/100</strong>
          <span>Следующая награда на {nextTarget} постах</span>
        </div>
        <div className="large-progress">
          <span style={{ width: `${getProgressPercent(totalBankedPosts)}%` }} />
        </div>
      </div>
      <div className="season-track">
        {levels.map((entry) => (
          <article key={entry.level} className={entry.unlocked ? 'level-card unlocked' : 'level-card'}>
            <span>Ур. {entry.level}</span>
            <strong>{entry.target}</strong>
            <p>{entry.unlocked ? 'Открыто' : 'Капсула ближе'}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
