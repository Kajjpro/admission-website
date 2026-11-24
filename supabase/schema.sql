-- Admissions prep platform: schema, RLS, and core seed data.
-- Run in the Supabase SQL editor (or `supabase db push`), then run seed_universities.sql.


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  grade_level smallint check (grade_level between 9 and 12),
  target_regions text[] not null default '{}',
  role text not null default 'student' check (role in ('student', 'counselor', 'admin')),
  assigned_counselor_id uuid references public.profiles (id) on delete set null,
  sat_target smallint check (sat_target between 400 and 1600),
  ielts_target numeric(2, 1) check (ielts_target between 0 and 9),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  grade_level smallint not null check (grade_level between 9 and 12),
  category text not null check (category in ('essay', 'testing', 'ec', 'rec', 'general')),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.user_task_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.roadmap_tasks (id) on delete cascade,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  completed_at timestamptz,
  unique (user_id, task_id)
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null check (category in ('ps', 'study_plan', 'supplemental', 'sat', 'ielts', 'ec', 'rec')),
  title text not null,
  summary text,
  content_markdown text not null default '',
  -- [{ "platform": "College Essay Guy", "title": "...", "author": "...", "url": "..." }]
  source_attribution jsonb not null default '[]'::jsonb,
  reading_time_mins smallint not null default 5,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guide_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid not null references public.guides (id) on delete cascade,
  bookmarked boolean not null default false,
  completed_at timestamptz,
  unique (user_id, guide_id)
);

create table public.user_essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  counselor_id uuid references public.profiles (id) on delete set null,
  essay_type text not null check (essay_type in ('personal_statement', 'study_plan', 'supplemental')),
  title text not null default 'Untitled essay',
  prompt text,
  word_limit int,
  content text not null default '',
  word_count int not null default 0,
  review_status text not null default 'draft'
    check (review_status in ('draft', 'submitted', 'reviewed', 'meeting_scheduled', 'completed')),
  needs_in_person_meeting boolean not null default false,
  meeting_notes text,
  meeting_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Frozen copy of the essay at the moment it was sent for review.
create table public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.user_essays (id) on delete cascade,
  counselor_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  word_count int not null default 0,
  focus_areas text[] not null default '{}',
  student_note text,
  created_at timestamptz not null default now()
);

create table public.essay_feedback (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.user_essays (id) on delete cascade,
  submission_id uuid references public.essay_submissions (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  paragraph_index int,
  excerpt_quote text,
  comment text not null check (length(comment) > 0),
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  position_order int not null default 0,
  activity_type text not null default 'Other',
  impact_category text check (impact_category in ('leadership', 'service', 'research', 'arts_athletics', 'work_family')),
  role_title text not null default '',
  organization text not null default '',
  description text not null default '' check (length(description) <= 150),
  grades_participated int[] not null default '{}',
  hours_per_week numeric(4, 1) not null default 0,
  weeks_per_year smallint not null default 0 check (weeks_per_year between 0 and 52),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.test_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  test_type text not null check (test_type in ('SAT', 'IELTS')),
  test_date date not null,
  is_official boolean not null default false,
  total_score numeric(5, 1) not null,
  -- SAT: { "math": 720, "ebrw": 690 }  IELTS: { "listening": 7.5, "reading": 8, "writing": 6.5, "speaking": 7 }
  section_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  test_type text not null check (test_type in ('SAT', 'IELTS')),
  logged_on date not null default current_date,
  minutes int not null check (minutes > 0),
  focus text,
  created_at timestamptz not null default now()
);

create table public.recommenders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  teacher_name text not null,
  subject text,
  relationship_context text,
  brag_sheet_notes text,
  status text not null default 'not_asked' check (status in ('not_asked', 'requested', 'in_progress', 'submitted')),
  due_date date,
  thank_you_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brag_sheets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text not null,
  city text,
  region text not null,
  qs_rank int,
  platform text,
  -- [{ "round": "Early Action", "date": "2026-11-01", "window": "Dec–Feb", "note": "..." }]
  deadlines jsonb not null default '[]'::jsonb,
  testing text,
  english text,
  app_fee text,
  financial_aid text,
  notes text,
  website text,
  deadline_status text not null default 'estimated' check (deadline_status in ('confirmed', 'estimated')),
  cycle text not null default 'Fall 2027 entry',
  last_reviewed date not null default current_date,
  updated_at timestamptz not null default now()
);

create table public.user_universities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  university_id uuid not null references public.universities (id) on delete cascade,
  round text,
  status text not null default 'researching'
    check (status in ('researching', 'applying', 'submitted', 'admitted', 'waitlisted', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, university_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index on public.profiles (assigned_counselor_id);
create index on public.profiles (role);
create index on public.roadmap_tasks (grade_level, sort_order);
create index on public.user_task_progress (user_id);
create index on public.guides (category);
create index on public.guide_progress (user_id);
create index on public.user_essays (user_id);
create index on public.user_essays (counselor_id, review_status);
create index on public.essay_submissions (essay_id, created_at desc);
create index on public.essay_feedback (essay_id, created_at);
create index on public.activities (user_id, position_order);
create index on public.test_scores (user_id, test_type, test_date);
create index on public.study_logs (user_id, logged_on);
create index on public.recommenders (user_id);
create index on public.universities (country);
create index on public.universities (qs_rank);
create index on public.user_universities (user_id);

-- ---------------------------------------------------------------------------
-- Helpers (security definer so policies can call them without recursing into RLS)
-- ---------------------------------------------------------------------------

create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('counselor', 'admin'), false)
$$;

-- True when the caller is the student's assigned counselor, or an admin.
create or replace function public.counsels(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p
    where p.id = student and p.assigned_counselor_id = auth.uid()
  )
$$;

create or replace function public.can_view_essay(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_essays e
    where e.id = target
      and (
        e.user_id = auth.uid()
        or public.is_admin()
        or (e.submitted_at is not null and (e.counselor_id = auth.uid() or public.counsels(e.user_id)))
      )
  )
$$;

create or replace function public.has_shared_essay_with_me(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_essays e
    where e.user_id = student and e.counselor_id = auth.uid() and e.submitted_at is not null
  )
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'guides', 'user_essays', 'activities', 'recommenders', 'brag_sheets', 'universities', 'user_universities']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Every new auth user gets a student profile. Staff roles are granted by an admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Non-admins cannot change their role, and may only point assigned_counselor_id at a staff member.
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  new.email := old.email;
  if new.assigned_counselor_id is distinct from old.assigned_counselor_id
     and new.assigned_counselor_id is not null
     and not exists (select 1 from public.profiles where id = new.assigned_counselor_id and role in ('counselor', 'admin')) then
    raise exception 'assigned_counselor_id must reference a counselor';
  end if;
  return new;
end $$;

create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

create or replace function public.count_words(body text)
returns int language sql immutable as $$
  select case when btrim(coalesce(body, '')) = '' then 0
    else array_length(regexp_split_to_array(btrim(body), '\s+'), 1) end
$$;

-- Students own the writing; counselors own the review fields.
create or replace function public.guard_essay()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.word_count := public.count_words(new.content);

  if tg_op = 'INSERT' or auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if auth.uid() = old.user_id then
    if new.review_status is distinct from old.review_status
       and new.review_status in ('reviewed', 'meeting_scheduled') then
      raise exception 'Only a counselor can set review status to %', new.review_status;
    end if;
    if new.counselor_id is not null and new.counselor_id is distinct from old.counselor_id
       and not exists (select 1 from public.profiles where id = new.counselor_id and role in ('counselor', 'admin')) then
      raise exception 'counselor_id must reference a counselor';
    end if;
    new.user_id := old.user_id;
  else
    if new.content is distinct from old.content
       or new.title is distinct from old.title
       or new.prompt is distinct from old.prompt
       or new.essay_type is distinct from old.essay_type
       or new.user_id is distinct from old.user_id
       or new.counselor_id is distinct from old.counselor_id
       or new.submitted_at is distinct from old.submitted_at then
      raise exception 'Counselors can only update review fields';
    end if;
  end if;
  return new;
end $$;

create trigger guard_essay before insert or update on public.user_essays
  for each row execute function public.guard_essay();

create or replace function public.stamp_task_completion()
returns trigger language plpgsql as $$
begin
  new.completed_at := case when new.status = 'completed' then coalesce(new.completed_at, now()) else null end;
  return new;
end $$;

create trigger stamp_task_completion before insert or update on public.user_task_progress
  for each row execute function public.stamp_task_completion();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.user_task_progress enable row level security;
alter table public.guides enable row level security;
alter table public.guide_progress enable row level security;
alter table public.user_essays enable row level security;
alter table public.essay_submissions enable row level security;
alter table public.essay_feedback enable row level security;
alter table public.activities enable row level security;
alter table public.test_scores enable row level security;
alter table public.study_logs enable row level security;
alter table public.recommenders enable row level security;
alter table public.brag_sheets enable row level security;
alter table public.universities enable row level security;
alter table public.user_universities enable row level security;

-- profiles
create policy "profiles: read own, staff directory, counselor's students"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or role in ('counselor', 'admin')
    or public.counsels(id)
    or public.has_shared_essay_with_me(id)
  );

create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Shared catalogs: everyone signed in reads, admins write.
do $$
declare t text;
begin
  foreach t in array array['roadmap_tasks', 'guides', 'universities']
  loop
    execute format('create policy "%1$s: read" on public.%1$I for select to authenticated using (true)', t);
    execute format('create policy "%1$s: admin write" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Student-owned records: owner has full access, the assigned counselor (or admin) can read.
do $$
declare t text;
begin
  foreach t in array array['user_task_progress', 'guide_progress', 'activities', 'test_scores', 'study_logs', 'recommenders', 'brag_sheets', 'user_universities']
  loop
    execute format('create policy "%1$s: owner" on public.%1$I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "%1$s: counselor read" on public.%1$I for select to authenticated using (public.counsels(user_id))', t);
  end loop;
end $$;

-- essays: conditions are written against the row itself (not can_view_essay) so they also
-- hold for a row that is being inserted or updated in the same statement.
create policy "essays: read" on public.user_essays for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (submitted_at is not null and (counselor_id = auth.uid() or public.counsels(user_id)))
  );

create policy "essays: insert own" on public.user_essays for insert to authenticated
  with check (user_id = auth.uid());

create policy "essays: update" on public.user_essays for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (submitted_at is not null and (counselor_id = auth.uid() or public.counsels(user_id)))
  );

create policy "essays: delete own" on public.user_essays for delete to authenticated
  using (user_id = auth.uid());

-- submissions
create policy "submissions: read" on public.essay_submissions for select to authenticated
  using (public.can_view_essay(essay_id));

create policy "submissions: owner creates" on public.essay_submissions for insert to authenticated
  with check (exists (select 1 from public.user_essays e where e.id = essay_id and e.user_id = auth.uid()));

-- feedback
create policy "feedback: read" on public.essay_feedback for select to authenticated
  using (public.can_view_essay(essay_id));

create policy "feedback: write" on public.essay_feedback for insert to authenticated
  with check (author_id = auth.uid() and public.can_view_essay(essay_id));

create policy "feedback: resolve" on public.essay_feedback for update to authenticated
  using (public.can_view_essay(essay_id))
  with check (public.can_view_essay(essay_id));

create policy "feedback: delete own" on public.essay_feedback for delete to authenticated
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed: roadmap tasks
-- ---------------------------------------------------------------------------

insert into public.roadmap_tasks (grade_level, category, title, description, priority, sort_order) values
(9, 'general', 'Map out a four-year course plan', 'Sit down with your counselor and sketch which courses you will take each year, aiming for the most rigorous load you can sustain.', 'high', 1),
(9, 'ec', 'Try three new activities', 'Join clubs, teams, or community programs. The goal this year is exploration, not titles.', 'medium', 2),
(9, 'general', 'Build a study system', 'Pick a planner or app, set a weekly review time, and track grades in every class.', 'high', 3),
(9, 'essay', 'Start a moments journal', 'Write a few lines each week about things you noticed, questions you had, or conversations that stuck with you. These become essay material later.', 'low', 4),
(9, 'testing', 'Read for pleasure every week', 'Strong reading habits now pay off on the SAT Reading & Writing section and on IELTS Reading.', 'medium', 5),
(9, 'rec', 'Get to know one teacher well', 'Ask questions in class and visit office hours. Recommendation letters are built over years.', 'low', 6),
(9, 'general', 'Spend part of the summer productively', 'A job, a course, a project, or caring for family all count. Write down what you did and learned.', 'medium', 7),

(10, 'testing', 'Take a diagnostic SAT or IELTS', 'Sit a full timed practice test to find your baseline and decide which test fits your target countries.', 'high', 1),
(10, 'ec', 'Go deeper in one or two activities', 'Narrow down to the activities you care about most and look for ways to take on responsibility.', 'high', 2),
(10, 'general', 'Research countries and systems', 'Compare how the US, UK, Canada, Europe, and Asia admit students: holistic review, predicted grades, entrance exams, or rolling admission.', 'medium', 3),
(10, 'essay', 'Complete the Values Exercise', 'Identify your core values. You will return to this list when choosing essay topics.', 'medium', 4),
(10, 'general', 'Build a starter university list', 'Add 10–15 universities from the deadlines page across regions you are considering.', 'medium', 5),
(10, 'rec', 'Keep a record of standout class moments', 'Note projects, presentations, and discussions where you did your best work. Teachers will need specifics.', 'low', 6),
(10, 'ec', 'Plan a summer project or program', 'Research programs early; many selective summer programs close applications in January–March.', 'medium', 7),

(11, 'testing', 'Sit your first official SAT or IELTS', 'Aim for a first sitting in the fall or winter so you have time for a retake.', 'high', 1),
(11, 'general', 'Finalize a balanced university list', 'Group schools into reach, target, and likely. Check each one''s testing and language requirements.', 'high', 2),
(11, 'rec', 'Ask two teachers for recommendations', 'Ask in person in the spring, then follow up with your brag sheet.', 'high', 3),
(11, 'essay', 'Brainstorm personal statement topics', 'Use the Essence Objects and Values exercises to draft a shortlist of three topics.', 'high', 4),
(11, 'ec', 'Draft your activity list', 'Write 150-character descriptions for your top 10 activities with hours and weeks per year.', 'medium', 5),
(11, 'testing', 'Retake to reach your target score', 'Use your score log to focus on the weakest section before the retake.', 'medium', 6),
(11, 'essay', 'Write a full personal statement draft', 'Get a complete draft done over the summer and send it to your counselor for structural feedback.', 'high', 7),

(12, 'essay', 'Finish personal statement and study plan', 'Revise with counselor feedback. Book an in-person meeting for the final read-through.', 'high', 1),
(12, 'general', 'Confirm every deadline and round', 'Check each university''s official site. Early rounds often close November 1 or October 15.', 'high', 2),
(12, 'essay', 'Write supplemental essays', 'Research each school''s programs so your "Why us" essays are specific.', 'high', 3),
(12, 'rec', 'Send recommenders your deadlines', 'Share a single list of schools and dates, and thank each recommender when letters are in.', 'high', 4),
(12, 'testing', 'Send official score reports', 'Order SAT/IELTS reports to each university that requires them.', 'medium', 5),
(12, 'general', 'Apply for financial aid and scholarships', 'Complete CSS Profile or national forms and track scholarship deadlines alongside applications.', 'high', 6),
(12, 'general', 'Compare offers and decide', 'Weigh cost, program fit, and outcomes. Most US decisions are due May 1.', 'medium', 7);

-- ---------------------------------------------------------------------------
-- Seed: guides
-- Summaries are written in our own words and credit the original methodology.
-- ---------------------------------------------------------------------------

insert into public.guides (slug, category, title, summary, reading_time_mins, source_attribution, content_markdown) values
('values-exercise', 'ps', 'The Values Exercise', 'Find the values that drive your choices before you pick an essay topic.', 6,
'[{"platform":"College Essay Guy","title":"The Values Exercise","author":"Ethan Sawyer","url":"https://www.collegeessayguy.com"}]',
$md$## Why start with values

Most weak essays start with a topic ("my trip", "my sport") and hope meaning shows up later. Starting with values reverses that: you decide what you want a reader to understand about you, then look for the moments that prove it.

## How to do it

1. Read through a long list of values (curiosity, family, justice, craft, independence, humor, faith, and so on).
2. Circle every value that feels true for you. Don't overthink it.
3. Cut your list down to ten, then to five.
4. For each of your final five, write one specific moment from your life where that value showed up in a decision you made.

## What you get

A short list of values with evidence attached. When you start drafting, each paragraph of a montage essay can map to one value, or a narrative essay can show one value under pressure.

## Common traps

- **Choosing values you think sound impressive.** Admissions readers notice when the evidence doesn't match.
- **Stopping at the list.** The moments are the useful part.
$md$),

('essence-objects', 'ps', 'Essence Objects', 'Use ordinary objects to uncover stories only you could tell.', 5,
'[{"platform":"College Essay Guy","title":"Essence Objects Exercise","author":"Ethan Sawyer","url":"https://www.collegeessayguy.com"}]',
$md$## The idea

An essence object is something you own or use that says something real about you: a cracked phone case, a recipe card, a bus pass, a notebook of chess openings. Objects make good essay anchors because they are concrete and specific.

## How to do it

1. List 10–20 objects that matter to you or that someone would find in your room, bag, or kitchen.
2. Next to each, write one value or quality it represents.
3. Pick the three objects that connect to the most interesting stories.
4. For each, freewrite for ten minutes: where it came from, what it has seen, what it says about how you think.

## Turning it into an essay

Objects work well as the thread in a **montage** essay, where each paragraph explores a different side of you connected by a common element.
$md$),

('montage-vs-narrative', 'ps', 'Montage vs. Narrative Structure', 'Choose the structure that fits your story instead of forcing a challenge narrative.', 7,
'[{"platform":"College Essay Guy","title":"Narrative vs. Montage Structure","author":"Ethan Sawyer","url":"https://www.collegeessayguy.com/blog/how-to-write-a-college-essay"}]',
$md$## Two shapes for a personal statement

**Narrative** tells one story over time: a challenge, what you did, and what changed. It works best if you have faced a significant difficulty and the essay can show how it shaped you.

**Montage** collects several moments linked by a theme or thread (an object, a place, a question). It works well if you haven't had a single defining challenge, which is true for most students.

## Picking one

| If you... | Try |
| --- | --- |
| faced a clear, significant challenge | Narrative |
| want to show range across interests and values | Montage |
| keep writing a list of achievements | Montage, with a stronger thread |

## Checklist for a montage

- Can you name the thread in one sentence?
- Does each paragraph show a different value?
- Does the ending connect back to the thread with new insight?

## Checklist for a narrative

- Is the challenge described in under a third of the essay?
- Is most of the space spent on what you did and learned?
$md$),

('hooks-that-work', 'ps', 'Opening Hooks That Work', 'Start in a specific moment and skip the dictionary definitions.', 5,
'[{"platform":"Hack the College Essay","title":"Hack the College Essay","author":"Brian Taylor"}]',
$md$## What a hook needs to do

The first two sentences should make a tired reader want the third. You don't need fireworks. You need specificity.

## Openings to avoid

- Quotes from famous people
- Dictionary definitions
- "Ever since I was young..."
- A summary of the whole essay

## Openings that tend to work

- **In the middle of a moment:** "The third time the soup boiled over, my grandmother stopped helping."
- **An unexpected detail:** something only you would notice.
- **A real question you had:** framed as you actually thought it at the time.

## Exercise

Write five different first sentences for your draft. Read them aloud. Keep the one that is most specific, not the most dramatic.
$md$),

('avoiding-cliches', 'ps', 'Avoiding Clichés and Trophy Lists', 'Reflection beats résumé. Show how you think, not just what you did.', 6,
'[{"platform":"Hack the College Essay","title":"Hack the College Essay","author":"Brian Taylor"}]',
$md$## The trophy list problem

Your activity list already shows what you did. If the essay repeats it ("I am captain of..., president of..., winner of..."), you have spent 650 words on information the reader already has.

## Clichés readers see constantly

- The winning goal or losing the big game
- A service trip that "opened my eyes"
- Moving to a new country described only in general terms
- "This taught me to never give up"

These topics aren't banned. They are crowded, so the details and reflection must be unmistakably yours.

## Authentic voice

- Write the way you speak to an adult you respect.
- Use the words you actually use. Thesaurus words read as stiff.
- After every story beat, ask: *what did I think, and why does it matter?*

## Quick test

Cover your name. Could a classmate have written this essay? If yes, add specifics until the answer is no.
$md$),

('study-plan-framework', 'study_plan', 'Study Plan & Motivation Letter Framework', 'A four-part structure for scholarship and global applications.', 8,
'[{"platform":"stoic.education","title":"Study plan framework (placeholder — replace with stoic.education guide link)","author":"stoic.education","url":"https://stoic.education"}]',
$md$## When you need one

Universities in China, Korea, Japan, much of Europe, and most government scholarships (for example CSC, GKS, MEXT, DAAD) ask for a study plan or motivation letter instead of a US-style personal statement. Readers want a clear academic direction, not a life story.

## Structure

1. **Academic background.** Courses, projects, research, or competitions that prepared you. Be specific about what you learned.
2. **Intended major and direction.** What you want to study and the questions you want to explore. Name subfields where you can.
3. **University fit.** Specific programs, labs, professors, or courses at this university. This section should not be reusable for another school.
4. **Plans after graduation.** How the degree connects to your career or to your home country's needs. Scholarship committees weigh this heavily.

## Tone

Direct and concrete. Short paragraphs. Avoid flattery ("your prestigious university").

> Admin note: this guide is a placeholder for stoic.education materials. Edit it from the Content page and attach the original links.
$md$),

('why-us-essays', 'supplemental', 'Writing "Why Us" Supplements', 'Research-driven supplements that only fit one school.', 6,
'[{"platform":"College Essay Guy","title":"How to Write the Why Us Essay","author":"Ethan Sawyer","url":"https://www.collegeessayguy.com"},{"platform":"stoic.education","title":"Supplemental essay resources (placeholder)","author":"stoic.education","url":"https://stoic.education"}]',
$md$## The goal

Show the match between what you want and what the school specifically offers. A strong "Why us" essay fails the swap test: if you replace the school's name with another, it stops making sense.

## Research sources

- Course catalog and specific classes
- Faculty research pages
- Student organizations and their recent events
- Study abroad, co-op, or research programs

## Structure that works

1. One sentence on what you want from your education.
2. Three to four specific offerings, each tied to something from your own background.
3. One sentence on what you would contribute.

## Avoid

Rankings, weather, campus beauty, and anything from the first paragraph of the school's homepage.
$md$),

('sat-strategy', 'sat', 'Digital SAT Section Strategy', 'How the adaptive format works and where to focus your study time.', 6, '[]',
$md$## Format

The digital SAT has two sections, each split into two modules: **Reading & Writing** (54 questions, 64 minutes) and **Math** (44 questions, 70 minutes). Your performance on module 1 decides the difficulty of module 2.

## What that means for strategy

- **Module 1 matters most.** Accuracy there unlocks the harder module 2, which is needed for top scores.
- **There's no penalty for guessing.** Never leave a question blank.
- **Use Desmos.** The built-in graphing calculator solves many algebra questions faster than by hand.

## Study plan

1. Take a full practice test in Bluebook.
2. Log the score here and sort missed questions by skill.
3. Spend 70% of your time on your two weakest skills.
4. Retest every three to four weeks.
$md$),

('ielts-band-descriptors', 'ielts', 'IELTS Band Descriptors, Explained', 'What examiners look for in Writing and Speaking.', 7, '[]',
$md$## Four criteria

Both Writing and Speaking are scored on four equally weighted criteria.

**Writing:** Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.

**Speaking:** Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.

## Moving from 6.5 to 7+

- **Task Response:** take a clear position and keep it through the essay.
- **Coherence:** one main idea per paragraph, with linking that isn't mechanical.
- **Lexical Resource:** use less common words accurately; collocations matter more than rare words.
- **Grammar:** mix complex sentences in naturally, with most sentences error-free.

## Practice routine

Write one Task 2 essay in 40 minutes, three times a week. Check it against the descriptors and log a self-estimated band.
$md$),

('activity-list', 'ec', 'Writing a Strong Activity List', 'Use 150 characters to show impact, not just membership.', 5,
'[{"platform":"College Essay Guy","title":"How to Write the Activities List","author":"Ethan Sawyer","url":"https://www.collegeessayguy.com"}]',
$md$## Every character counts

The Common App gives you 50 characters for position, 100 for organization, and 150 for the description.

## Formula

**Action verb + what you did + measurable result.**

- Weak: "Member of the robotics club. Participated in competitions."
- Strong: "Designed drivetrain for 4 robots; led 6-person build team; regional finalist 2025, 2026."

## Tips

- Drop full sentences and filler words.
- Use numbers: people, hours, dollars, outcomes.
- Order activities by importance to you, not by time.
$md$),

('asking-for-recommendations', 'rec', 'Asking for Recommendation Letters', 'Who to ask, when, and what to give them.', 4, '[]',
$md$## Who to ask

Two teachers from core academic subjects in grade 11 or 12 who have seen you work hard, ideally including one in your intended field.

## When

Ask in person in the spring of grade 11. Follow up in early September of grade 12 with your brag sheet and deadlines.

## What to give them

- Your brag sheet (build it in the LOR Manager)
- A list of universities and deadlines
- One or two specific moments from their class

## After

Send a thank-you note, and tell them where you are admitted.
$md$);
