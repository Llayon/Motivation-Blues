import { useMemo, useState } from 'react';
import { downloadTextFile, formatPostsForExport } from '../lib/exportPosts';
import { useAppStore } from '../store/useAppStore';

export function ExportPanel() {
  const posts = useAppStore((state) => state.posts);
  const bankedPosts = useMemo(() => posts.filter((post) => post.status === 'banked'), [posts]);
  const exportText = useMemo(() => formatPostsForExport(bankedPosts), [bankedPosts]);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCopy() {
    if (!exportText) {
      return;
    }

    await navigator.clipboard.writeText(exportText);
    setStatus('Банк постов скопирован в буфер.');
  }

  function handleDownload() {
    if (!exportText) {
      return;
    }

    downloadTextFile('100-posts-bank.txt', exportText);
    setStatus('TXT-файл сформирован.');
  }

  return (
    <section className="export-layout">
      <article className="content-panel glass-panel">
        <p className="eyebrow">Экспорт</p>
        <h1>Забрать банк постов</h1>
        <p className="hero-copy">
          Экспортируются только тексты со статусом «в банке». Черновики остаются внутри приложения.
        </p>
        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            disabled={!exportText}
            onClick={handleDownload}
          >
            Скачать .txt
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={!exportText}
            onClick={handleCopy}
          >
            Скопировать
          </button>
        </div>
        {status ? <p className="status-line">{status}</p> : null}
      </article>
      <article className="export-preview glass-panel">
        <h2>Превью</h2>
        <pre data-testid="export-preview">
          {exportText || 'Пока нет готовых постов для экспорта.'}
        </pre>
      </article>
    </section>
  );
}
