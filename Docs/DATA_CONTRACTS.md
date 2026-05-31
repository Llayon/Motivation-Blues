# Data Contracts

## Supabase Tables

### `profiles`
- `id`: user UUID, references `auth.users`.
- `season_start_at`: timestamp used to calculate season day.
- `timezone`: user timezone.
- `total_banked_posts`: season counter, capped at 100.

### `posts`
- `user_id`: owner UUID.
- `title`: text.
- `content`: post body.
- `status`: `draft | banked | archived`.
- `char_count`: integer.
- `word_count`: integer.
- `tags`: text array.
- `banked_at`: timestamp when post first became banked.

### `daily_progress`
- Unique by `user_id + date_key`.
- Tracks banked posts for the local date.
- Stores `season_day`, `goal_posts`, `banked_count`, `goal_capsule_awarded`.

### `capsules`
- Unique by `user_id + trigger_key`.
- `capsule_type`: `daily | milestone`.
- `status`: `sealed | opened`.
- `created_from`: human-readable source.
- `item_id`: set after opening.

### `items_dictionary`
- Static item catalog.
- Public read.
- Seeded in the initial migration.

### `user_inventory`
- User-owned item instances.
- Duplicates are allowed.

## RPC

### `bank_post(post_id uuid)`
Expected behavior:
- Requires authenticated user.
- Only acts on the caller's post.
- If already banked, returns without duplicating counters.
- Updates `posts.status` to `banked`.
- Increments `profiles.total_banked_posts`.
- Updates `daily_progress`.
- Creates at most one daily capsule per user/date.
- Creates milestone capsules only once.

### `open_capsule(capsule_id uuid)`
Expected behavior:
- Requires authenticated user.
- Only opens caller-owned sealed capsules.
- Rejects already opened capsules.
- Rolls item rarity with weights: common 60, rare 25, epic 10, legendary 5.
- Creates `user_inventory`.
- Marks capsule as opened.

## RLS Rules
- Users can read/write only their own rows in `profiles`, `posts`, `daily_progress`, `capsules`, `user_inventory`.
- `items_dictionary` is readable by everyone.
- No frontend code should need service-role access.

## Migration Rules
- Never edit a migration that has been applied remotely.
- Add a new timestamped migration for schema or RPC changes.
- Run `npx supabase migration list` before and after pushing DB changes.
- Run `npm run supabase:push` or `npx supabase db push` after creating a migration.
