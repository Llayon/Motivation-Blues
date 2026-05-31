import {
  getDailyGoal,
  getLocalDateKey,
  getPlannedTotalByDay,
  getProgressPercent,
  getSeasonDay
} from '../lib/season';
import { useAppStore } from '../store/useAppStore';

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
  const delta = profile.totalBankedPosts - plannedTotal;

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
          Сегодняшняя норма: {goalPosts}.{' '}
          {remainingToday === 0
            ? 'Норма закрыта, капсула вдохновения уже ждет на полке.'
            : `Осталось сохранить в банк: ${remainingToday}.`}
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setActiveView('editor')} type="button">
            Открыть редактор
          </button>
          <button className="ghost-button" onClick={() => setActiveView('capsules')} type="button">
            Капсулы: {sealedCapsules}
          </button>
        </div>
        {cloudError ? <p className="status-line negative">{cloudError}</p> : null}
      </article>

      <article className="stat-card glass-panel">
        <span>План к этому дню</span>
        <strong>{plannedTotal}</strong>
        <p className={delta >= 0 ? 'positive' : 'negative'}>
          {delta >= 0 ? `+${delta} к плану` : `${delta} от плана`}
        </p>
      </article>
      <article className="stat-card glass-panel">
        <span>Черновики</span>
        <strong>{draftsCount}</strong>
        <p>Можно довести до банка без нового пустого листа.</p>
      </article>
      <article className="stat-card glass-panel">
        <span>Фигурки</span>
        <strong>{inventory.length}</strong>
        <p>Дубликаты остаются на полке как копии коллекции.</p>
      </article>

      <article className="focus-note glass-panel">
        <p className="eyebrow">Правило фокуса</p>
        <h2>Пишем здесь, награды открываем потом.</h2>
        <p>
          Приложение не прерывает поток анбоксингом. После дневной нормы капсула
          тихо добавляется в очередь, а ритуал открытия запускается вручную.
        </p>
      </article>
    </section>
  );
}
