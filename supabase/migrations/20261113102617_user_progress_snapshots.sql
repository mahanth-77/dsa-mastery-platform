-- VERTEX account progress snapshots.
-- Applied to Supabase project vertex (zknprjttuftrgeqyoedc) as migration
-- 20261113102617_user_progress_snapshots.

create table public.user_progress_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version bigint not null default 1 check (version >= 1),
  progress jsonb not null check (jsonb_typeof(progress) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.user_progress_snapshots enable row level security;

create policy "Users can read their own progress snapshot"
  on public.user_progress_snapshots
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can insert their own progress snapshot"
  on public.user_progress_snapshots
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own progress snapshot"
  on public.user_progress_snapshots
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

grant usage on schema public to authenticated;
revoke all on public.user_progress_snapshots from anon;
grant select, insert, update on public.user_progress_snapshots to authenticated;

create or replace function public.save_user_progress_snapshot(
  p_expected_version bigint,
  p_progress jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_saved public.user_progress_snapshots%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_expected_version is null or p_expected_version < 0 then
    raise exception 'Invalid expected snapshot version' using errcode = '22023';
  end if;

  if p_progress is null or jsonb_typeof(p_progress) <> 'object' then
    raise exception 'Progress snapshot must be a JSON object' using errcode = '22023';
  end if;

  if octet_length(p_progress::text) > 2097152 then
    raise exception 'Progress snapshot exceeds the 2 MB limit' using errcode = '22001';
  end if;

  insert into public.user_progress_snapshots (user_id, version, progress, updated_at)
  select v_user_id, 1, p_progress, now()
  where p_expected_version = 0
  on conflict (user_id) do update
    set version = public.user_progress_snapshots.version + 1,
        progress = excluded.progress,
        updated_at = now()
    where public.user_progress_snapshots.version = p_expected_version
  returning * into v_saved;

  if found then
    return jsonb_build_object(
      'saved', true,
      'version', v_saved.version,
      'progress', v_saved.progress,
      'updated_at', v_saved.updated_at
    );
  end if;

  select *
    into v_saved
    from public.user_progress_snapshots
   where user_id = v_user_id;

  return jsonb_build_object(
    'saved', false,
    'version', coalesce(v_saved.version, 0),
    'progress', v_saved.progress,
    'updated_at', v_saved.updated_at
  );
end;
$$;

revoke all on function public.save_user_progress_snapshot(bigint, jsonb) from public, anon;
grant execute on function public.save_user_progress_snapshot(bigint, jsonb) to authenticated;
