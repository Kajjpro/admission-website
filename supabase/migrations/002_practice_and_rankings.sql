-- 002: staff invites, THE rankings, SAT practice (question bank, attempts, spaced review), AI tutor log.
-- Run after schema.sql and seed_universities.sql, then run seed_sat_questions.sql.

-- ---------------------------------------------------------------------------
-- Staff invites: pre-approve a counselor/admin by email. Applied on sign-up,
-- or immediately if the person already has an account.
-- ---------------------------------------------------------------------------

create table public.staff_invites (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('counselor', 'admin')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.staff_invites enable row level security;
create policy "staff_invites: admin" on public.staff_invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  invite public.staff_invites;
begin
  select * into invite from public.staff_invites where email = lower(new.email);
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', invite.full_name),
    coalesce(invite.role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.apply_staff_invite()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set role = new.role, full_name = coalesce(full_name, new.full_name)
  where lower(email) = new.email;
  return new;
end $$;

create trigger apply_staff_invite after insert or update on public.staff_invites
  for each row execute function public.apply_staff_invite();

-- ---------------------------------------------------------------------------
-- Rankings: switch from QS to Times Higher Education (THE) World University Rankings 2027.
-- Positions marked confirmed come from THE's 2027 results announcement (30 Sep 2026);
-- the rest are approximate and the UI shows them as bands.
-- ---------------------------------------------------------------------------

alter table public.universities rename column qs_rank to world_rank;
alter table public.universities add column ranking_source text not null default 'THE World University Rankings 2027';
alter table public.universities add column rank_confirmed boolean not null default false;

update public.universities u
set world_rank = v.rank, rank_confirmed = v.confirmed
from (values
  ('University of Oxford', 1, true), ('Massachusetts Institute of Technology', 2, true),
  ('Princeton University', 3, true), ('Stanford University', 3, true),
  ('University of Cambridge', 5, true), ('Harvard University', 6, true),
  ('California Institute of Technology', 7, true), ('Imperial College London', 8, true),
  ('University of California, Berkeley', 9, true), ('Yale University', 9, true),
  ('Tsinghua University', 11, true), ('Peking University', 13, true),
  ('National University of Singapore', 15, true), ('University College London', 17, true),
  ('The University of Tokyo', 27, true), ('Nanyang Technological University', 28, true),
  ('The University of Melbourne', 34, true), ('University of California, San Diego', 37, true),
  ('London School of Economics', 47, true), ('Delft University of Technology', 50, true),
  ('The University of Sydney', 51, true), ('Kyoto University', 62, true),
  ('Institut Polytechnique de Paris', 75, true),
  ('ETH Zurich', 12, false), ('University of Chicago', 14, false), ('University of Pennsylvania', 14, false),
  ('Johns Hopkins University', 16, false), ('Columbia University', 18, false),
  ('University of California, Los Angeles', 19, false), ('Cornell University', 20, false),
  ('University of Michigan', 22, false), ('University of Toronto', 22, false),
  ('Carnegie Mellon University', 24, false), ('Northwestern University', 25, false),
  ('Technical University of Munich', 26, false), ('University of Washington', 26, false),
  ('Duke University', 28, false), ('University of Edinburgh', 30, false),
  ('New York University', 31, false), ('EPFL', 33, false), ('The University of Hong Kong', 35, false),
  ('Fudan University', 36, false), ('King''s College London', 38, false),
  ('Ludwig Maximilian University of Munich', 39, false), ('Shanghai Jiao Tong University', 40, false),
  ('Georgia Institute of Technology', 41, false), ('University of British Columbia', 41, false),
  ('Université PSL', 42, false), ('The Chinese University of Hong Kong', 44, false),
  ('McGill University', 45, false), ('KU Leuven', 46, false), ('Zhejiang University', 47, false),
  ('University of Illinois Urbana-Champaign', 48, false), ('Heidelberg University', 49, false),
  ('University of Texas at Austin', 50, false), ('University of Science and Technology of China', 52, false),
  ('Washington University in St. Louis', 53, false), ('University of Manchester', 54, false),
  ('Seoul National University', 57, false), ('Monash University', 58, false),
  ('The Hong Kong University of Science and Technology', 60, false), ('University of Amsterdam', 61, false),
  ('Brown University', 65, false), ('Australian National University', 70, false),
  ('Boston University', 72, false), ('Nanjing University', 73, false), ('Sorbonne University', 75, false),
  ('University of Southern California', 76, false), ('UNSW Sydney', 79, false),
  ('The University of Queensland', 80, false), ('University of Bristol', 81, false),
  ('KAIST', 82, false), ('University of Glasgow', 85, false), ('The Hong Kong Polytechnic University', 88, false),
  ('Purdue University', 99, false), ('University of Copenhagen', 103, false), ('Yonsei University', 105, false),
  ('University of Warwick', 108, false), ('City University of Hong Kong', 125, false),
  ('Trinity College Dublin', 140, false), ('Rice University', 145, false), ('Dartmouth College', 148, false),
  ('The University of Auckland', 152, false), ('National Taiwan University', 165, false),
  ('Durham University', 170, false), ('Tongji University', 175, false), ('University of Waterloo', 180, false),
  ('KTH Royal Institute of Technology', 185, false), ('Wuhan University', 190, false),
  ('Universiti Malaya', 251, false)
) as v(name, rank, confirmed)
where u.name = v.name;

-- ---------------------------------------------------------------------------
-- SAT practice
-- ---------------------------------------------------------------------------

alter table public.profiles add column daily_goal smallint not null default 10 check (daily_goal between 1 and 100);

create table public.sat_questions (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('rw', 'math')),
  domain text not null,
  skill text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  passage text,
  stem text not null,
  answer_type text not null default 'mcq' check (answer_type in ('mcq', 'spr')),
  -- [{ "key": "A", "text": "...", "rationale": "why this choice is right or wrong" }]
  choices jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  accepted_answers text[] not null default '{}',
  explanation text not null,
  source text not null default 'original' check (source in ('original', 'ai', 'imported')),
  verified boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.sat_questions (section, domain, skill, difficulty);

create table public.sat_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.sat_questions (id) on delete cascade,
  response text not null,
  is_correct boolean not null default false,
  seconds int not null default 0 check (seconds >= 0),
  created_at timestamptz not null default now()
);

create index on public.sat_attempts (user_id, created_at desc);
create index on public.sat_attempts (user_id, question_id);

-- Spaced review queue: a miss schedules the question for tomorrow; each later
-- correct answer pushes it out (1 -> 3 -> 7 -> 21 days); three in a row clears it.
create table public.sat_reviews (
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.sat_questions (id) on delete cascade,
  due_on date not null,
  interval_days int not null default 1,
  correct_streak int not null default 0,
  primary key (user_id, question_id)
);

create index on public.sat_reviews (user_id, due_on);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid references public.sat_questions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

create index on public.tutor_messages (user_id, question_id, created_at);

-- Grading happens in the database so a client can't mark its own answer correct.
create or replace function public.sat_numeric(value text)
returns numeric language plpgsql immutable as $$
declare
  cleaned text := replace(btrim(value), ' ', '');
begin
  if cleaned ~ '^-?\d+/\d+$' and split_part(ltrim(cleaned, '-'), '/', 2)::numeric <> 0 then
    return (case when cleaned like '-%' then -1 else 1 end)
      * split_part(ltrim(cleaned, '-'), '/', 1)::numeric / split_part(ltrim(cleaned, '-'), '/', 2)::numeric;
  elsif cleaned ~ '^-?(\d+\.?\d*|\.\d+)$' then
    return cleaned::numeric;
  end if;
  return null;
end $$;

create or replace function public.grade_sat_attempt()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  q public.sat_questions;
  given numeric;
begin
  select * into q from public.sat_questions where id = new.question_id;
  if q.answer_type = 'mcq' then
    new.is_correct := upper(btrim(new.response)) = upper(q.correct_answer);
  else
    given := public.sat_numeric(new.response);
    new.is_correct := replace(btrim(new.response), ' ', '') = any (q.accepted_answers || q.correct_answer)
      or (given is not null and exists (
        select 1 from unnest(q.accepted_answers || q.correct_answer) a
        where public.sat_numeric(a) is not null and abs(public.sat_numeric(a) - given) < 0.0005
      ));
  end if;
  return new;
end $$;

create trigger grade_sat_attempt before insert on public.sat_attempts
  for each row execute function public.grade_sat_attempt();

create or replace function public.schedule_sat_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.is_correct then
    insert into public.sat_reviews (user_id, question_id, due_on, interval_days, correct_streak)
    values (new.user_id, new.question_id, current_date + 1, 1, 0)
    on conflict (user_id, question_id)
      do update set due_on = current_date + 1, interval_days = 1, correct_streak = 0;
  else
    update public.sat_reviews
    set correct_streak = correct_streak + 1,
        interval_days = case interval_days when 1 then 3 when 3 then 7 else 21 end,
        due_on = current_date + case interval_days when 1 then 3 when 3 then 7 else 21 end
    where user_id = new.user_id and question_id = new.question_id;
    delete from public.sat_reviews
    where user_id = new.user_id and question_id = new.question_id and correct_streak >= 3;
  end if;
  return new;
end $$;

create trigger schedule_sat_review after insert on public.sat_attempts
  for each row execute function public.schedule_sat_review();

alter table public.sat_questions enable row level security;
alter table public.sat_attempts enable row level security;
alter table public.sat_reviews enable row level security;
alter table public.tutor_messages enable row level security;

create policy "sat_questions: read verified" on public.sat_questions for select to authenticated
  using (verified or public.is_staff());
create policy "sat_questions: staff write" on public.sat_questions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "sat_attempts: owner read" on public.sat_attempts for select to authenticated
  using (user_id = auth.uid() or public.counsels(user_id));
create policy "sat_attempts: owner insert" on public.sat_attempts for insert to authenticated
  with check (user_id = auth.uid());

-- Review rows are written only by the trigger above.
create policy "sat_reviews: owner read" on public.sat_reviews for select to authenticated
  using (user_id = auth.uid() or public.counsels(user_id));

create policy "tutor_messages: owner read" on public.tutor_messages for select to authenticated
  using (user_id = auth.uid() or public.counsels(user_id));
create policy "tutor_messages: owner insert" on public.tutor_messages for insert to authenticated
  with check (user_id = auth.uid());
