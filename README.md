# 100 постов за 40 дней

Геймифицированный светлый веб-редактор для начинающего блогера. Пользователь пишет тексты в стол, явно сохраняет готовые посты в банк, двигается по 40-дневному сезону и открывает капсулы с воксельными фигурками классиков.

## Что реализовано

- React + TypeScript + Vite.
- Zustand-состояние с Supabase cloud sync и локальным fallback через `localStorage`.
- Дзен-редактор: черновики, сохранение в банк, счетчики знаков и слов, теги.
- Терминаторский автосейв редактора в IndexedDB с восстановлением аварийного буфера.
- Банк постов: редактирование готовых текстов без повторного начисления прогресса, поиск и навигация по тегам.
- Цель `100` постов за `40` дней с нормой `2/3/2`.
- Season Pass на `20` уровней по `5` постов.
- Очередь капсул без валюты и тикетов.
- Фразы классиков из статического банка, без ИИ.
- 3D-витрина на `@react-three/fiber` с простыми воксельными placeholder-фигурками.
- Экспорт готовых постов в `.txt` или буфер обмена.
- Supabase CLI-проект, миграции, RLS и RPC для облачной базы.

## LLM-First Workflow

Этот репозиторий подготовлен для разработки через LLM-агентов.

Стартовые документы:

- `AGENTS.md` - обязательные инструкции для агентов.
- `Docs/CONTEXT.md` - краткий контекст продукта.
- `Docs/PROJECT_MEMORY.md` - память проекта и принятые решения.
- `Docs/PRODUCT_SPEC.md` - продуктовая спецификация.
- `Docs/ARCHITECTURE.md` - архитектура и data flow.
- `Docs/DATA_CONTRACTS.md` - Supabase tables, RPC, RLS.
- `Docs/SEARCH_ASSIST.md` - быстрые поисковые маршруты для LLM-агентов.
- `Docs/TASKS.md` - agent-ready backlog.
- `Docs/RELEASE_PLAYBOOK.md` - релизный процесс.

Перед крупной задачей агент должен прочитать `AGENTS.md`, `Docs/CONTEXT.md`, `Docs/PROJECT_MEMORY.md` и релевантные документы из `Docs/`.

Коммиты должны быть в формате Conventional Commits:

```text
feat: add bank search
fix: preserve editor buffer on reload
docs: update release playbook
```

Проверка последнего коммита:

```bash
npm run commitlint:last
```

## Запуск

```bash
npm install
npm run dev
```

Проверки:

```bash
npm test
npm run test:e2e
npm run build
npm run search:assist -- "bankPost"
npm run commitlint:last
```

## GitHub Pages Deploy

Production URL:

```text
https://llayon.github.io/Motivation-Blues/
```

Деплой идет через GitHub Actions из `.github/workflows/deploy-pages.yml` на каждый push в `main`.

GitHub Actions env:

- `VITE_SUPABASE_URL` хранится как repository variable.
- `VITE_SUPABASE_ANON_KEY` хранится как repository secret.
- `VITE_BASE_PATH=/Motivation-Blues/` задается в workflow.

Локальная проверка GitHub Pages base path:

```powershell
$env:VITE_BASE_PATH='/Motivation-Blues/'
npm run build
Remove-Item Env:\VITE_BASE_PATH
```

## Supabase Cloud

Проект подключен к Supabase:

- Project: `Motivation blues`
- Ref: `ryvvthzzlnbejyvlrqup`
- Region: `eu-central-1`

Локальные env лежат в `.env.local`. Шаблон публичных переменных: `.env.example`.

Основные команды:

```bash
npm run supabase:status
npm run supabase:push
npx supabase migration list
```

Миграции:

- `supabase/migrations/20260601000100_initial_schema.sql`
- `supabase/migrations/20260601002000_fix_bank_post_rpc.sql`

Пароль БД не коммитится и хранится локально в `supabase/.temp/`.
