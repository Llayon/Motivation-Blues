import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export function Bank() {
  const posts = useAppStore((state) => state.posts);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const bankedPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === 'banked')
        .sort((a, b) => new Date(b.bankedAt ?? b.updatedAt).getTime() - new Date(a.bankedAt ?? a.updatedAt).getTime()),
    [posts]
  );

  return (
    <section className="content-panel glass-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Банк</p>
          <h1>Готовые посты</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setActiveView('editor')}>
          Написать еще
        </button>
      </div>
      {bankedPosts.length === 0 ? (
        <p className="empty-state">Пока нет готовых постов. Открой редактор и сохрани первый текст в банк.</p>
      ) : (
        <div className="post-grid">
          {bankedPosts.map((post, index) => (
            <article className="post-card" key={post.id}>
              <div className="post-card-header">
                <span>#{bankedPosts.length - index}</span>
                <span>{new Date(post.bankedAt ?? post.updatedAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <h2>{post.title || 'Без названия'}</h2>
              <p>{post.content}</p>
              <footer>
                <span>{post.charCount} знаков</span>
                {post.tags.map((tag) => (
                  <em key={tag}>#{tag}</em>
                ))}
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
