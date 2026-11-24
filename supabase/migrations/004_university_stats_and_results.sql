-- 004: admission statistics for universities (U.S. data from the Department of Education's
-- College Scorecard), English-test minimums, and a "where our students got in" wall.

alter table public.universities
  add column curated boolean not null default false,
  add column scorecard_id int unique,
  add column state text,
  add column ownership text check (ownership in ('public', 'private')),
  add column acceptance_rate numeric(5, 4),
  add column sat_avg smallint,
  add column sat_25 smallint,
  add column sat_75 smallint,
  add column act_mid smallint,
  add column undergrad_size int,
  add column tuition_out_of_state int,
  add column cost_of_attendance int,
  add column intl_share numeric(5, 4),
  add column grad_rate numeric(5, 4),
  add column median_earnings int,
  add column ielts_min numeric(2, 1),
  add column toefl_min smallint,
  add column stats_source text;

-- The 90 hand-researched universities (deadlines, requirements) are the curated set.
update public.universities set curated = true;

-- Pull English-test minimums out of the curated text where a single number is stated.
update public.universities
set ielts_min = nullif(substring(english from 'IELTS ([0-9](\.[05])?)'), '')::numeric,
    toefl_min = nullif(substring(english from 'TOEFL (?:iBT )?([0-9]{2,3})'), '')::smallint
where curated;

create index on public.universities (acceptance_rate);
create index on public.universities (sat_avg);

create table public.admission_results (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  university_name text not null,
  university_id uuid references public.universities (id) on delete set null,
  class_year smallint check (class_year between 2000 and 2100),
  scholarship text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admission_results enable row level security;
create policy "admission_results: read" on public.admission_results for select to authenticated using (true);
create policy "admission_results: staff write" on public.admission_results for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
