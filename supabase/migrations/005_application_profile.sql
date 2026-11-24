-- 005: the student's application profile (academics, spike statement, honours) and
-- counsellor review of the whole profile from a snapshot the student sends.

alter table public.profiles
  add column school_name text,
  add column intended_major text,
  add column gpa text,
  add column class_rank text,
  add column rigor_notes text,
  add column spike_statement text check (length(spike_statement) <= 200);

create table public.honors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(title) <= 100),
  level text not null default 'school' check (level in ('school', 'district', 'city_aimag', 'national', 'international')),
  grade smallint check (grade between 9 and 12),
  description text,
  created_at timestamptz not null default now()
);
create index on public.honors (user_id);
alter table public.honors enable row level security;
create policy "honors: owner" on public.honors for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "honors: counselor read" on public.honors for select to authenticated
  using (public.counsels(user_id));

create table public.profile_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  counselor_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  student_note text,
  -- Frozen copy of the profile as sent, so the counsellor reviews exactly what the student saw.
  snapshot jsonb not null,
  overall_feedback text,
  section_feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index on public.profile_reviews (counselor_id, status, created_at desc);
create index on public.profile_reviews (student_id, created_at desc);
alter table public.profile_reviews enable row level security;

create policy "profile_reviews: read" on public.profile_reviews for select to authenticated
  using (student_id = auth.uid() or counselor_id = auth.uid() or public.counsels(student_id));

create policy "profile_reviews: student sends" on public.profile_reviews for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = counselor_id and p.role in ('counselor', 'admin'))
  );

create policy "profile_reviews: counselor responds" on public.profile_reviews for update to authenticated
  using (counselor_id = auth.uid() or public.is_admin())
  with check (counselor_id = auth.uid() or public.is_admin());

-- Counsellors may only write feedback; the student's snapshot and note stay as sent.
create or replace function public.guard_profile_review()
returns trigger language plpgsql as $$
begin
  if new.snapshot is distinct from old.snapshot or new.student_id is distinct from old.student_id
     or new.student_note is distinct from old.student_note or new.counselor_id is distinct from old.counselor_id then
    raise exception 'Only feedback fields can be changed';
  end if;
  new.reviewed_at := case when new.status = 'reviewed' then coalesce(new.reviewed_at, now()) else null end;
  return new;
end $$;

create trigger guard_profile_review before update on public.profile_reviews
  for each row execute function public.guard_profile_review();
