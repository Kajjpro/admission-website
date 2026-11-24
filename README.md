# Admissions Prep

University application planning for grades 9–12: roadmap, Essay Studio with counselor review, SAT/IELTS tracking, activity list, recommendation tracker, and a deadline database for top-ranked universities worldwide.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, RLS) · Framer Motion · cmdk

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed_universities.sql`.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon/publishable key.
4. `npm install && npm run dev`

Every new account is a **student**. To make someone a counselor or admin, set their role once in SQL:

```sql
update profiles set role = 'admin' where email = 'you@school.edu';
```

After that, admins manage roles from **Content & users → Users**.

## Roles

| Role | Can |
| --- | --- |
| Student | Everything on their own data. Chooses a counselor during onboarding. |
| Counselor | Reads essays sent to them (or by their assigned students) once submitted; comments, sets review status, flags essays for an in-person meeting. Read-only access to assigned students' scores, activities and recommenders. |
| Admin | All of the above for every student, plus guides, roadmap tasks, university data, and user roles. |

All of this is enforced by RLS policies and triggers in `schema.sql`, not just the UI. Counselors cannot edit essay text; students cannot mark their own essays as reviewed or change their role.

## Essay review flow

1. Student writes in the Essay Studio (autosaves).
2. **Review → Send draft** stores a frozen snapshot in `essay_submissions` and sets the status to *Submitted for review*.
3. Counselor opens it from the **Review queue**, comments on paragraphs (select text to quote it) or overall, and updates the status. Turning on *Bring to in-person meeting* adds a time and discussion notes.
4. **Meeting view** (`/essays/[id]/meeting`) is a full-screen reading mode for a laptop or tablet, with comments beside each paragraph.

## University deadlines

`seed_universities.sql` has 90 universities from the QS 2026 top 500 (US, UK, Canada, Europe, China, Hong Kong, Singapore, Japan, Korea, Taiwan, Australia, NZ) for **Fall 2027 entry**:

- `deadline_status = 'confirmed'`: checked against a 2027-entry source (UCAS dates, HKU).
- `'estimated'`: based on the university's previous cycle. Many Chinese, Korean, Japanese and Australian universities publish dates late, so those rows hold a typical window and `"date": null` until the dates come out.

Edit deadlines from **Content & users → Universities**. Re-running the seed file updates existing rows by name.

## Guide sources

Seed guides summarize methods from College Essay Guy and Hack the College Essay in original wording, with attribution. The stoic.education entries are placeholders: replace them with the real guides and links from the Content page.
