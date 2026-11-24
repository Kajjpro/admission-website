-- 003: log practice done on official sites (College Board bank, Bluebook, Khan, SATQuestionBank.org)
-- so it counts toward streaks, daily goals and skill progress.

create table public.official_practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null check (source in ('sat_question_bank', 'college_board', 'bluebook', 'khan', 'other')),
  section text check (section in ('rw', 'math')),
  skill text,
  attempted int not null check (attempted between 1 and 500),
  correct int not null check (correct between 0 and attempted),
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index on public.official_practice_logs (user_id, logged_on desc);

alter table public.official_practice_logs enable row level security;
create policy "official_practice_logs: owner" on public.official_practice_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "official_practice_logs: counselor read" on public.official_practice_logs for select to authenticated
  using (public.counsels(user_id));
