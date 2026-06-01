import {
  getDailyGoal,
  getLocalDateKey,
  getPlannedTotalByDay,
  getProgressPercent,
  getSeasonDay
} from '../lib/season';
import { useAppStore } from '../store/useAppStore';

function getCapsuleLabel(count: number) {
  if (count === 1) {
    return 'Доступна 1 капсула ✨';
  }

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const noun = lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)
    ? 'капсулы'
    : 'капсул';

  return `Доступно ${count} ${noun} ✨`;
}

export function Dashboard() {
  const profile = useAppStore((state) => state.profile)!;
  const posts = useAppStore((state) => state.posts);
  const dailyProgress = useAppStore((state) => state.dailyProgress);
  const capsules = useAppStore((state) => state.capsules);
  const inventory = useAppStore((state) => state.inventory);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const mode = useAppStore((state) => state.mode);
  const cloudError = useAppStore((state) => state.cloudError);

  const seasonDay = getSeasonDay(profile.seasonStartAt);
  const dateKey = getLocalDateKey();
  const goalPosts = getDailyGoal(seasonDay);
  const todayProgress = dailyProgress.find((entry) => entry.dateKey === dateKey);
  const todayBanked = todayProgress?.bankedCount ?? 0;
  const remainingToday = Math.max(0, goalPosts - todayBanked);
  const draftsCount = posts.filter((post) => post.status === 'draft').length;
  const sealedCapsules = capsules.filter((capsule) => capsule.status === 'sealed').length;
  const plannedTotal = getPlannedTotalByDay(seasonDay);
  const plannedBeforeToday = seasonDay === 1 ? 0 : getPlannedTotalByDay(seasonDay - 1);
  const overduePosts = Math.max(0, plannedBeforeToday - profile.totalBankedPosts);
  const capsuleLabel = getCapsuleLabel(sealedCapsules);

  return (
    <section className="dashboard-grid">
      <article className="hero-panel glass-panel">
        <p className="eyebrow">День {seasonDay} из 40</p>
        <h1>{profile.totalBankedPosts}/100 постов в банке</h1>
        <p className="mode-pill">{mode === 'cloud' ? 'Supabase cloud sync' : 'Local browser mode'}</p>
        <div className="large-progress">
          <span style={{ width: `${getProgressPercent(profile.totalBankedPosts)}%` }} />
        </div>
        <p className="hero-copy">
          Фокус дня: {goalPosts} текста. Еще {remainingToday} текста — и вы великолепны ✨
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setActiveView('editor')} type="button">
            Открыть редактор
          </button>
          {sealedCapsules > 0 ? (
            <button className="ghost-button" onClick={() => setActiveView('capsules')} type="button">
              {capsuleLabel}
            </button>
          ) : null}
        </div>
        {cloudError ? <p className="status-line negative">{cloudError}</p> : null}
      </article>

      <article className="stat-card glass-panel">
        <span>План к этому дню</span>
        <strong>{plannedTotal}</strong>
        {overduePosts > 0 ? (
          <p className="negative">-{overduePosts} просрочено</p>
        ) : (
          <p>Цель на сегодня: {goalPosts} поста</p>
        )}
      </article>
      <article className="stat-card glass-panel">
        <span>Черновики</span>
        <strong>{draftsCount}</strong>
        <p>Тексты, которые ждут финальной шлифовки.</p>
      </article>
      <article className="stat-card glass-panel">
        <span>Фигурки</span>
        <strong>{inventory.length}</strong>
        <p>Твоя коллекция классиков.</p>
      </article>

      <article className="focus-note glass-panel">
        <p className="eyebrow">Правило фокуса</p>
        <h2>Текст — на первом месте.</h2>
        <p>
          Мы не отвлекаем тебя всплывающими окнами. Закрой дневную норму, и твоя
          награда тихо добавится в инвентарь. Открой её, когда будешь готов.
        </p>
      </article>
    </section>
  );
}
