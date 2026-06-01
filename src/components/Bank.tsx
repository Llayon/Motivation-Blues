import { useMemo, useState } from 'react';
import { filterBankedPosts, getTagCounts } from '../lib/bankFilters';
import { useAppStore } from '../store/useAppStore';
import { TelegramMarkup } from './TelegramMarkup';

export function Bank() {
  const posts = useAppStore((state) => state.posts);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const openPostInEditor = useAppStore((state) => state.openPostInEditor);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const bankedPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === 'banked')
        .sort((a, b) => new Date(b.bankedAt ?? b.updatedAt).getTime() - new Date(a.bankedAt ?? a.updatedAt).getTime()),
    [posts]
  );
  const tagCounts = useMemo(() => getTagCounts(bankedPosts), [bankedPosts]);
  const filteredPosts = useMemo(
    () => filterBankedPosts(bankedPosts, query, selectedTags),
    [bankedPosts, query, selectedTags]
  );

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((selectedTag) => selectedTag !== tag)
        : [...current, tag]
    );
  }

  function resetFilters() {
    setQuery('');
    setSelectedTags([]);
  }

  const hasFilters = query.trim().length > 0 || selectedTags.length > 0;

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
        <>
          <div className="bank-tools">
            <input
              data-testid="bank-search"
              type="search"
              placeholder="Искать по заголовку, тексту или тегам"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="tag-filter-list" aria-label="Навигация по тегам">
              {tagCounts.map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  data-testid="tag-filter"
                  className={selectedTags.includes(tag) ? 'tag-chip active' : 'tag-chip'}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag} <span>{count}</span>
                </button>
              ))}
            </div>
            {hasFilters ? (
              <button className="plain-button" data-testid="reset-bank-filters" type="button" onClick={resetFilters}>
                Сбросить фильтры
              </button>
            ) : null}
          </div>

          {filteredPosts.length === 0 ? (
            <p className="empty-state">По этим фильтрам ничего не найдено.</p>
          ) : (
            <div className="post-grid">
              {filteredPosts.map((post, index) => (
                <article className="post-card" data-testid="bank-post-card" key={post.id}>
                  <div className="post-card-header">
                    <span>#{filteredPosts.length - index}</span>
                    <span>{new Date(post.bankedAt ?? post.updatedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <h2>{post.title || 'Без названия'}</h2>
                  <p>
                    <TelegramMarkup text={post.content} />
                  </p>
                  <footer>
                    <span>{post.charCount} знаков</span>
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        className="inline-tag"
                        type="button"
                        onClick={() => toggleTag(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </footer>
                  <button
                    className="ghost-button"
                    data-testid="edit-banked-post"
                    type="button"
                    onClick={() => openPostInEditor(post.id)}
                  >
                    Редактировать
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
