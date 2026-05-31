create extension if not exists "pgcrypto";

create type public.post_status as enum ('draft', 'banked', 'archived');
create type public.capsule_status as enum ('sealed', 'opened');
create type public.capsule_type as enum ('daily', 'milestone');
create type public.item_rarity as enum ('common', 'rare', 'epic', 'legendary');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  season_start_at timestamptz not null default now(),
  timezone text not null default 'Europe/Moscow',
  total_banked_posts integer not null default 0 check (total_banked_posts between 0 and 100)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null,
  status public.post_status not null default 'draft',
  char_count integer not null default 0,
  word_count integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  banked_at timestamptz
);

create table public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  season_day integer not null check (season_day between 1 and 40),
  goal_posts integer not null check (goal_posts between 1 and 3),
  banked_count integer not null default 0,
  goal_capsule_awarded boolean not null default false,
  unique (user_id, date_key)
);

create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capsule_type public.capsule_type not null,
  status public.capsule_status not null default 'sealed',
  trigger_key text not null,
  created_from text not null,
  acquired_at timestamptz not null default now(),
  opened_at timestamptz,
  item_id text,
  unique (user_id, trigger_key)
);

create table public.items_dictionary (
  id text primary key,
  name text not null,
  classic_id text not null,
  rarity public.item_rarity not null,
  model_url text not null,
  thumbnail_url text not null
);

create table public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.items_dictionary(id),
  capsule_id uuid not null references public.capsules(id),
  acquired_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.daily_progress enable row level security;
alter table public.capsules enable row level security;
alter table public.items_dictionary enable row level security;
alter table public.user_inventory enable row level security;

create policy "profiles own rows" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "posts own rows" on public.posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily progress own rows" on public.daily_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "capsules own rows" on public.capsules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "items readable" on public.items_dictionary
  for select using (true);

create policy "inventory own rows" on public.user_inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.items_dictionary (id, name, classic_id, rarity, model_url, thumbnail_url) values
  ('pushkin-bro-pen', 'Пушкин-братан с пером', 'pushkin', 'common', '/models/pushkin-bro-pen.gltf', '/thumbs/pushkin-bro-pen.png'),
  ('chekhov-dry-notebook', 'Чехов с блокнотом', 'chekhov', 'common', '/models/chekhov-dry-notebook.gltf', '/thumbs/chekhov-dry-notebook.png'),
  ('tolstoy-tea-mug', 'Толстой с кружкой чая', 'tolstoy', 'rare', '/models/tolstoy-tea-mug.gltf', '/thumbs/tolstoy-tea-mug.png'),
  ('gogol-shinel-ghost', 'Гоголь в подозрительной шинели', 'gogol', 'rare', '/models/gogol-shinel-ghost.gltf', '/thumbs/gogol-shinel-ghost.png'),
  ('dostoevsky-inner-abyss', 'Достоевский и внутренняя бездна', 'dostoevsky', 'epic', '/models/dostoevsky-inner-abyss.gltf', '/thumbs/dostoevsky-inner-abyss.png'),
  ('mayakovsky-megaphone', 'Маяковский с мегафоном', 'mayakovsky', 'epic', '/models/mayakovsky-megaphone.gltf', '/thumbs/mayakovsky-megaphone.png'),
  ('bulgakov-master-cat', 'Булгаков с котом', 'bulgakov', 'legendary', '/models/bulgakov-master-cat.gltf', '/thumbs/bulgakov-master-cat.png')
on conflict (id) do update set
  name = excluded.name,
  classic_id = excluded.classic_id,
  rarity = excluded.rarity,
  model_url = excluded.model_url,
  thumbnail_url = excluded.thumbnail_url;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.season_goal_for_day(day_number integer)
returns integer
language sql
immutable
as $$
  select case
    when greatest(1, least(40, day_number)) <= 10 then 2
    when greatest(1, least(40, day_number)) <= 30 then 3
    else 2
  end;
$$;

create or replace function public.bank_post(post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_row public.profiles%rowtype;
  post_row public.posts%rowtype;
  date_key date;
  season_day integer;
  goal_posts integer;
  previous_total integer;
  next_total integer;
  previous_daily_count integer;
  next_daily_count integer;
  milestone integer;
  milestones integer[] := array[10, 25, 50, 75, 100];
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into profile_row
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    insert into public.profiles (id) values (current_user_id)
    returning * into profile_row;
  end if;

  select * into post_row
  from public.posts
  where id = post_id and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Post not found';
  end if;

  if post_row.status = 'banked' then
    return jsonb_build_object(
      'total_banked_posts', profile_row.total_banked_posts,
      'already_banked', true
    );
  end if;

  previous_total := profile_row.total_banked_posts;
  next_total := least(100, previous_total + 1);
  date_key := (now() at time zone profile_row.timezone)::date;
  season_day := greatest(
    1,
    least(40, date_key - ((profile_row.season_start_at at time zone profile_row.timezone)::date) + 1)
  );
  goal_posts := public.season_goal_for_day(season_day);

  update public.posts
  set status = 'banked',
      char_count = char_length(content),
      word_count = array_length(regexp_split_to_array(trim(content), '\s+'), 1),
      updated_at = now(),
      banked_at = now()
  where id = post_id;

  update public.profiles
  set total_banked_posts = next_total
  where id = current_user_id;

  insert into public.daily_progress (
    user_id,
    date_key,
    season_day,
    goal_posts,
    banked_count,
    goal_capsule_awarded
  )
  values (current_user_id, date_key, season_day, goal_posts, 1, false)
  on conflict (user_id, date_key)
  do update set banked_count = public.daily_progress.banked_count + 1
  returning banked_count into next_daily_count;

  previous_daily_count := next_daily_count - 1;

  if previous_daily_count < goal_posts and next_daily_count >= goal_posts then
    insert into public.capsules (user_id, capsule_type, trigger_key, created_from)
    values (
      current_user_id,
      'daily',
      'daily:' || date_key::text,
      'День ' || season_day::text || ': дневная норма'
    )
    on conflict (user_id, trigger_key) do nothing;

    update public.daily_progress
    set goal_capsule_awarded = true
    where user_id = current_user_id and date_key = bank_post.date_key;
  end if;

  foreach milestone in array milestones loop
    if previous_total < milestone and next_total >= milestone then
      insert into public.capsules (user_id, capsule_type, trigger_key, created_from)
      values (
        current_user_id,
        'milestone',
        'milestone:' || milestone::text,
        milestone::text || ' постов в банке'
      )
      on conflict (user_id, trigger_key) do nothing;
    end if;
  end loop;

  return jsonb_build_object(
    'total_banked_posts', next_total,
    'season_day', season_day,
    'goal_posts', goal_posts,
    'daily_banked_count', next_daily_count
  );
end;
$$;

create or replace function public.open_capsule(capsule_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  capsule_row public.capsules%rowtype;
  rarity_roll numeric := random() * 100;
  selected_rarity public.item_rarity;
  selected_item public.items_dictionary%rowtype;
  inventory_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into capsule_row
  from public.capsules
  where id = capsule_id and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Capsule not found';
  end if;

  if capsule_row.status = 'opened' then
    raise exception 'Capsule already opened';
  end if;

  selected_rarity := case
    when rarity_roll < 60 then 'common'::public.item_rarity
    when rarity_roll < 85 then 'rare'::public.item_rarity
    when rarity_roll < 95 then 'epic'::public.item_rarity
    else 'legendary'::public.item_rarity
  end;

  select * into selected_item
  from public.items_dictionary
  where rarity = selected_rarity
  order by random()
  limit 1;

  if not found then
    select * into selected_item
    from public.items_dictionary
    order by random()
    limit 1;
  end if;

  insert into public.user_inventory (user_id, item_id, capsule_id)
  values (current_user_id, selected_item.id, capsule_id)
  returning id into inventory_id;

  update public.capsules
  set status = 'opened',
      opened_at = now(),
      item_id = selected_item.id
  where id = capsule_id;

  return jsonb_build_object(
    'inventory_id', inventory_id,
    'item_id', selected_item.id,
    'item_name', selected_item.name,
    'rarity', selected_item.rarity
  );
end;
$$;
