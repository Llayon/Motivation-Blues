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
  local_date_key date;
  calculated_season_day integer;
  calculated_goal_posts integer;
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
  local_date_key := (now() at time zone profile_row.timezone)::date;
  calculated_season_day := greatest(
    1,
    least(40, local_date_key - ((profile_row.season_start_at at time zone profile_row.timezone)::date) + 1)
  );
  calculated_goal_posts := public.season_goal_for_day(calculated_season_day);

  update public.posts
  set status = 'banked',
      char_count = char_length(content),
      word_count = coalesce(array_length(regexp_split_to_array(trim(content), '\s+'), 1), 0),
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
  values (current_user_id, local_date_key, calculated_season_day, calculated_goal_posts, 1, false)
  on conflict (user_id, date_key)
  do update set banked_count = public.daily_progress.banked_count + 1
  returning banked_count into next_daily_count;

  previous_daily_count := next_daily_count - 1;

  if previous_daily_count < calculated_goal_posts and next_daily_count >= calculated_goal_posts then
    insert into public.capsules (user_id, capsule_type, trigger_key, created_from)
    values (
      current_user_id,
      'daily',
      'daily:' || local_date_key::text,
      'День ' || calculated_season_day::text || ': дневная норма'
    )
    on conflict (user_id, trigger_key) do nothing;

    update public.daily_progress
    set goal_capsule_awarded = true
    where user_id = current_user_id and date_key = local_date_key;
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
    'season_day', calculated_season_day,
    'goal_posts', calculated_goal_posts,
    'daily_banked_count', next_daily_count
  );
end;
$$;
