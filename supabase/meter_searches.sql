-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
-- It lets the website save every search (meter number, Near Me, Check My Block)
-- and read the total count, without letting the public read anyone's rows.

-- 1. Make sure the table has every column the site sends.
create table if not exists public.meter_searches (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);
alter table public.meter_searches add column if not exists created_at timestamptz default now();
alter table public.meter_searches add column if not exists search_type text;
alter table public.meter_searches add column if not exists meter_number text;
alter table public.meter_searches add column if not exists found boolean;
alter table public.meter_searches add column if not exists street text;
alter table public.meter_searches add column if not exists borough text;
alter table public.meter_searches add column if not exists result text;
alter table public.meter_searches add column if not exists meter_hours text;
alter table public.meter_searches add column if not exists meters_found integer;
alter table public.meter_searches add column if not exists user_email text;
alter table public.meter_searches add column if not exists device text;

-- 2. Allow the website (anon key) to insert rows, but not read/edit/delete them.
alter table public.meter_searches enable row level security;
drop policy if exists "anon can insert searches" on public.meter_searches;
create policy "anon can insert searches"
  on public.meter_searches for insert
  to anon, authenticated
  with check (true);

-- 3. Site-wide total for the "meters checked" counter (count only, no row data).
--    Counts searches that found a meter; failed lookups don't count.
create or replace function public.meter_check_count()
returns bigint
language sql
security definer
set search_path = public
as $$ select count(*) from public.meter_searches where found is true $$;

grant execute on function public.meter_check_count() to anon, authenticated;

-- 4. Tell the API about the new columns/function right away.
notify pgrst, 'reload schema';

-- 5. Confirmation: you should see one row saying "meter_searches is ready".
select 'meter_searches is ready' as status, count(*) as rows_so_far from public.meter_searches;
