# 100 постов за 40 дней

Геймифицированный светлый веб-редактор для начинающего блогера. Пользователь пишет тексты в стол, явно сохраняет готовые посты в банк, двигается по 40-дневному сезону и открывает капсулы с воксельными фигурками классиков.

## Что реализовано

- React + TypeScript + Vite.
- Zustand-состояние с Supabase cloud sync и локальным fallback через `localStorage`.
- Дзен-редактор: черновики, сохранение в банк, счетчики знаков и слов, теги.
- Цель `100` постов за `40` дней с нормой `2/3/2`.
- Season Pass на `20` уровней по `5` постов.
- Очередь капсул без валюты и тикетов.
- Фразы классиков из статического банка, без ИИ.
- 3D-витрина на `@react-three/fiber` с простыми воксельными placeholder-фигурками.
- Экспорт готовых постов в `.txt` или буфер обмена.
- Supabase CLI-проект, миграции, RLS и RPC для облачной базы.

## Запуск

```bash
npm install
npm run dev
```

Проверки:

```bash
npm test
npm run build
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
