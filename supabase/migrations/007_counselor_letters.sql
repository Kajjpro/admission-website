-- 007: students ask their counsellor for a recommendation letter; the counsellor writes it
-- next to the student's brag sheet. The letter text is confidential: students see only status.

create table public.counselor_letters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles (id) on delete cascade,
  counselor_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'writing', 'done')),
  student_message text check (length(student_message) <= 2000),
  due_date date,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index on public.counselor_letters (counselor_id, status);
alter table public.counselor_letters enable row level security;

create policy "counselor_letters: read" on public.counselor_letters for select to authenticated
  using (student_id = auth.uid() or counselor_id = auth.uid() or public.counsels(student_id));
create policy "counselor_letters: student requests" on public.counselor_letters for insert to authenticated
  with check (
    student_id = auth.uid() and status = 'requested' and completed_at is null
    and exists (select 1 from public.profiles p where p.id = counselor_id and p.role in ('counselor', 'admin'))
  );
create policy "counselor_letters: update" on public.counselor_letters for update to authenticated
  using (student_id = auth.uid() or counselor_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or counselor_id = auth.uid() or public.is_admin());
create policy "counselor_letters: student cancels" on public.counselor_letters for delete to authenticated
  using (student_id = auth.uid() and status = 'requested');

-- Students may only edit their message and due date; the counsellor owns the status.
create or replace function public.guard_counselor_letter()
returns trigger language plpgsql as $$
begin
  if new.student_id is distinct from old.student_id then
    raise exception 'The student cannot change';
  end if;
  if auth.uid() = old.student_id and not public.is_staff() and (
       new.status is distinct from old.status or new.counselor_id is distinct from old.counselor_id
    or new.completed_at is distinct from old.completed_at or new.requested_at is distinct from old.requested_at) then
    raise exception 'Only your counsellor can change the letter status';
  end if;
  new.updated_at := now();
  new.completed_at := case when new.status = 'done' then coalesce(new.completed_at, now()) else null end;
  return new;
end $$;
create trigger guard_counselor_letter before update on public.counselor_letters
  for each row execute function public.guard_counselor_letter();

-- The letter itself, in its own table so row security can keep it from the student.
create table public.counselor_letter_bodies (
  letter_id uuid primary key references public.counselor_letters (id) on delete cascade,
  body text not null default '' check (length(body) <= 20000),
  updated_at timestamptz not null default now()
);
alter table public.counselor_letter_bodies enable row level security;
create policy "counselor_letter_bodies: writer" on public.counselor_letter_bodies for all to authenticated
  using (exists (select 1 from public.counselor_letters l where l.id = letter_id and (l.counselor_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.counselor_letters l where l.id = letter_id and (l.counselor_id = auth.uid() or public.is_admin())));
create trigger set_updated_at before update on public.counselor_letter_bodies
  for each row execute function public.set_updated_at();

-- The counsellor a student asked can open their brag sheet and profile even if not their assigned counsellor.
create or replace function public.brag_sheet_for_student(student uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if student is distinct from auth.uid() and not public.counsels(student)
     and not exists (select 1 from public.counselor_letters l where l.student_id = student and l.counselor_id = auth.uid()) then
    return null;
  end if;
  return public.brag_sheet_data(student);
end $$;

create or replace function public.asked_me_for_letter(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.counselor_letters l where l.student_id = student and l.counselor_id = auth.uid())
$$;

drop policy "profiles: read own, staff directory, counselor's students" on public.profiles;
create policy "profiles: read own, staff directory, counselor's students"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or role in ('counselor', 'admin')
    or public.counsels(id)
    or public.has_shared_essay_with_me(id)
    or public.asked_me_for_letter(id)
  );
