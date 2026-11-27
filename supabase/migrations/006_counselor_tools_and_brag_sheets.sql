-- 006: counsellor tools (tasks, private notes, counsellor-started profile reviews),
-- a school teacher directory, and brag sheets teachers open from a private link.

-- ---------------------------------------------------------------------------
-- Teacher directory: staff maintain it, students pick recommenders from it.
-- ---------------------------------------------------------------------------
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) <= 120),
  email text not null unique check (email = lower(email) and email ~ '^\S+@\S+\.\S+$'),
  subject text check (length(subject) <= 120),
  created_at timestamptz not null default now()
);
alter table public.teachers enable row level security;
create policy "teachers: read" on public.teachers for select to authenticated using (true);
create policy "teachers: staff write" on public.teachers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Recommenders: email, link to the directory, and a private link for the teacher.
-- ---------------------------------------------------------------------------
alter table public.recommenders
  add column email text check (email is null or email ~ '^\S+@\S+\.\S+$'),
  add column teacher_id uuid references public.teachers (id) on delete set null,
  add column share_token uuid not null default gen_random_uuid() unique,
  add column requested_at timestamptz,
  add column viewed_at timestamptz;

-- Everything a recommender needs, in one JSON document. Internal: callers check access first.
create or replace function public.brag_sheet_data(student uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'student', (select jsonb_build_object(
        'name', p.full_name, 'email', p.email, 'grade', p.grade_level, 'school', p.school_name,
        'major', p.intended_major, 'spike', p.spike_statement, 'gpa', p.gpa, 'class_rank', p.class_rank,
        'rigor', p.rigor_notes, 'regions', to_jsonb(p.target_regions))
      from public.profiles p where p.id = student),
    'answers', coalesce((select b.answers from public.brag_sheets b where b.user_id = student), '{}'::jsonb),
    'activities', coalesce((select jsonb_agg(jsonb_build_object(
        'role', a.role_title, 'organization', a.organization, 'description', a.description,
        'hours', a.hours_per_week, 'weeks', a.weeks_per_year, 'grades', to_jsonb(a.grades_participated))
        order by a.position_order)
      from public.activities a where a.user_id = student), '[]'::jsonb),
    'honors', coalesce((select jsonb_agg(jsonb_build_object('title', h.title, 'level', h.level, 'grade', h.grade) order by h.created_at)
      from public.honors h where h.user_id = student), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('type', t.test_type, 'best', t.best))
      from (select test_type, max(total_score) as best from public.test_scores where user_id = student group by test_type) t), '[]'::jsonb),
    'universities', coalesce((select jsonb_agg(jsonb_build_object('name', u.name, 'country', u.country, 'round', uu.round) order by u.name)
      from public.user_universities uu join public.universities u on u.id = uu.university_id where uu.user_id = student), '[]'::jsonb)
  )
$$;
revoke execute on function public.brag_sheet_data(uuid) from public, anon, authenticated;

-- For the teacher's private link. Works signed out; the token is the only key.
create or replace function public.brag_sheet_for_teacher(token uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  r public.recommenders;
begin
  select * into r from public.recommenders where share_token = token;
  if not found then return null; end if;
  if r.viewed_at is null then
    update public.recommenders set viewed_at = now() where id = r.id;
  end if;
  return public.brag_sheet_data(r.user_id) || jsonb_build_object(
    'recommender', jsonb_build_object('name', r.teacher_name, 'subject', r.subject, 'context', r.relationship_context,
      'notes', r.brag_sheet_notes, 'due_date', r.due_date, 'status', r.status));
end $$;
grant execute on function public.brag_sheet_for_teacher(uuid) to anon, authenticated;

-- The teacher marks the letter as submitted from the same link.
create or replace function public.teacher_mark_submitted(token uuid)
returns boolean language sql volatile security definer set search_path = public as $$
  update public.recommenders set status = 'submitted' where share_token = token returning true
$$;
grant execute on function public.teacher_mark_submitted(uuid) to anon, authenticated;

-- The student previews their own sheet; staff open their students'.
create or replace function public.brag_sheet_for_student(student uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if student is distinct from auth.uid() and not public.counsels(student) then return null; end if;
  return public.brag_sheet_data(student);
end $$;
grant execute on function public.brag_sheet_for_student(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tasks a counsellor assigns to a student.
-- ---------------------------------------------------------------------------
create table public.counselor_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  details text check (length(details) <= 1000),
  due_date date,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.counselor_tasks (student_id, done_at);
alter table public.counselor_tasks enable row level security;
create policy "counselor_tasks: read" on public.counselor_tasks for select to authenticated
  using (student_id = auth.uid() or public.counsels(student_id));
create policy "counselor_tasks: counselor creates" on public.counselor_tasks for insert to authenticated
  with check (created_by = auth.uid() and public.counsels(student_id));
create policy "counselor_tasks: update" on public.counselor_tasks for update to authenticated
  using (student_id = auth.uid() or public.counsels(student_id))
  with check (student_id = auth.uid() or public.counsels(student_id));
create policy "counselor_tasks: counselor deletes" on public.counselor_tasks for delete to authenticated
  using (public.counsels(student_id));

-- Students may only tick a task done or undone.
create or replace function public.guard_counselor_task()
returns trigger language plpgsql as $$
begin
  if auth.uid() = old.student_id and not public.counsels(old.student_id) and (
       new.title is distinct from old.title or new.details is distinct from old.details
    or new.due_date is distinct from old.due_date or new.student_id is distinct from old.student_id
    or new.created_by is distinct from old.created_by) then
    raise exception 'Students can only mark tasks done';
  end if;
  return new;
end $$;
create trigger guard_counselor_task before update on public.counselor_tasks
  for each row execute function public.guard_counselor_task();

-- ---------------------------------------------------------------------------
-- Private counsellor notes (students never see these).
-- ---------------------------------------------------------------------------
create table public.counselor_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'meeting', 'call')),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index on public.counselor_notes (student_id, created_at desc);
alter table public.counselor_notes enable row level security;
create policy "counselor_notes: read" on public.counselor_notes for select to authenticated
  using (public.counsels(student_id));
create policy "counselor_notes: write" on public.counselor_notes for insert to authenticated
  with check (author_id = auth.uid() and public.counsels(student_id));
create policy "counselor_notes: delete own" on public.counselor_notes for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Profile reviews a counsellor starts without waiting for the student.
-- They begin as drafts the student can't see until the counsellor sends them.
-- ---------------------------------------------------------------------------
alter table public.profile_reviews drop constraint profile_reviews_status_check;
alter table public.profile_reviews add constraint profile_reviews_status_check
  check (status in ('draft', 'submitted', 'reviewed'));
alter table public.profile_reviews add column started_by_counselor boolean not null default false;

drop policy "profile_reviews: read" on public.profile_reviews;
create policy "profile_reviews: read" on public.profile_reviews for select to authenticated
  using ((student_id = auth.uid() and status <> 'draft') or counselor_id = auth.uid() or public.counsels(student_id));

drop policy "profile_reviews: student sends" on public.profile_reviews;
create policy "profile_reviews: student sends" on public.profile_reviews for insert to authenticated
  with check (
    student_id = auth.uid() and status = 'submitted' and not started_by_counselor
    and exists (select 1 from public.profiles p where p.id = counselor_id and p.role in ('counselor', 'admin'))
  );
create policy "profile_reviews: counselor starts" on public.profile_reviews for insert to authenticated
  with check (counselor_id = auth.uid() and started_by_counselor and status = 'draft' and public.counsels(student_id));

create policy "profile_reviews: counselor discards draft" on public.profile_reviews for delete to authenticated
  using (status = 'draft' and (counselor_id = auth.uid() or public.is_admin()));

create or replace function public.guard_profile_review()
returns trigger language plpgsql as $$
begin
  if new.snapshot is distinct from old.snapshot or new.student_id is distinct from old.student_id
     or new.student_note is distinct from old.student_note or new.counselor_id is distinct from old.counselor_id
     or new.started_by_counselor is distinct from old.started_by_counselor then
    raise exception 'Only feedback fields can be changed';
  end if;
  if old.status <> 'draft' and new.status = 'draft' then
    raise exception 'A sent review cannot go back to draft';
  end if;
  new.reviewed_at := case when new.status = 'reviewed' then coalesce(new.reviewed_at, now()) else null end;
  return new;
end $$;
