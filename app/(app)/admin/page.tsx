import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GUIDE_CATEGORIES, TASK_CATEGORIES } from "@/lib/constants";
import { rankBand } from "@/lib/universities";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Card, PageHeader, buttonClass } from "@/components/ui";
import { SourceBadge } from "@/components/source-badge";
import type { Guide, Profile, RoadmapTask, University } from "@/lib/types";
import { DeleteButton, InviteForm, ResultForm, QuestionGenerator, QuestionImporter, TaskForm, UserRow } from "./admin-client";
import { SAT_TAXONOMY, type Section } from "@/lib/sat";
import { fetchAll } from "@/lib/fetch-all";
import { deleteGuide, deleteResult, deleteTask, removeInvite } from "@/app/actions/admin";

export const metadata = { title: "Content & users" };

const TABS = [
  ["guides", "Guides"],
  ["tasks", "Roadmap tasks"],
  ["questions", "Question bank"],
  ["universities", "Universities"],
  ["results", "Admission results"],
  ["users", "Users"],
] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab = "guides" } = await searchParams;
  const supabase = await createClient();

  return (
    <>
      <PageHeader title="Content & users" description="Manage guides and their source attribution, roadmap tasks, university deadlines, and staff roles." />
      <div className="mb-5 flex gap-1">
        {TABS.map(([id, label]) => (
          <Link key={id} href={`?tab=${id}`} className={cn("rounded-md px-3 py-1.5 text-sm", tab === id ? "bg-navy text-white" : "text-slate-600 hover:bg-white")}>
            {label}
          </Link>
        ))}
      </div>
      {tab === "guides" && <GuidesTab supabase={supabase} />}
      {tab === "tasks" && <TasksTab supabase={supabase} />}
      {tab === "questions" && <QuestionsTab supabase={supabase} />}
      {tab === "universities" && <UniversitiesTab supabase={supabase} />}
      {tab === "users" && <UsersTab supabase={supabase} />}
      {tab === "results" && <ResultsTab supabase={supabase} />}
    </>
  );
}

type Client = Awaited<ReturnType<typeof createClient>>;

async function GuidesTab({ supabase }: { supabase: Client }) {
  const { data } = await supabase.from("guides").select("*").order("category").order("title");
  return (
    <div className="space-y-3">
      <Link href="/admin/guides/new" className={buttonClass("primary", "sm")}>New guide</Link>
      <Card className="divide-y divide-line">
        {((data ?? []) as Guide[]).map((g) => (
          <div key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{g.title}</p>
              <p className="text-xs text-slate-500">/{g.slug} · {GUIDE_CATEGORIES[g.category]}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {g.source_attribution.map((s) => <SourceBadge key={s.platform + s.title} source={{ ...s, url: undefined }} />)}
            </div>
            {!g.published && <Badge tone="amber">Draft</Badge>}
            <Link href={`/admin/guides/${g.id}`} className={buttonClass("secondary", "sm")}>Edit</Link>
            <DeleteButton action={deleteGuide.bind(null, g.id)} label={g.title} />
          </div>
        ))}
      </Card>
    </div>
  );
}

async function TasksTab({ supabase }: { supabase: Client }) {
  const { data } = await supabase.from("roadmap_tasks").select("*").order("grade_level").order("sort_order");
  const tasks = (data ?? []) as RoadmapTask[];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {[9, 10, 11, 12].map((grade) => (
          <Card key={grade}>
            <p className="border-b border-line px-5 py-2.5 text-sm font-semibold">Grade {grade}</p>
            <ul className="divide-y divide-line">
              {tasks.filter((t) => t.grade_level === grade).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                  <p className="min-w-0 flex-1 truncate text-sm">{t.title}</p>
                  <span className="text-xs text-slate-500">{TASK_CATEGORIES[t.category]}</span>
                  {t.priority === "high" && <Badge tone="rose">High</Badge>}
                  <DeleteButton action={deleteTask.bind(null, t.id)} label={t.title} />
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <TaskForm />
    </div>
  );
}

async function UniversitiesTab({ supabase }: { supabase: Client }) {
  const { data } = await supabase.from("universities").select("id, name, country, world_rank, deadline_status, last_reviewed").eq("curated", true).order("world_rank");
  return (
    <div className="space-y-3">
      <Link href="/admin/universities/new" className={buttonClass("primary", "sm")}>Add university</Link>
      <Card className="divide-y divide-line">
        {((data ?? []) as University[]).map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name}</p>
              <p className="text-xs text-slate-500">{u.country} · THE {rankBand(u.world_rank)} · reviewed {formatDate(u.last_reviewed)}</p>
            </div>
            <Badge tone={u.deadline_status === "confirmed" ? "emerald" : "amber"}>{u.deadline_status}</Badge>
            <Link href={`/admin/universities/${u.id}`} className={buttonClass("secondary", "sm")}>Edit</Link>
          </div>
        ))}
      </Card>
    </div>
  );
}

async function UsersTab({ supabase }: { supabase: Client }) {
  const [{ data }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("*").order("role").order("full_name"),
    supabase.from("staff_invites").select("*").order("created_at"),
  ]);
  const users = (data ?? []) as Profile[];
  const staff = users.filter((u) => u.role !== "student").map((u) => ({ id: u.id, name: u.full_name ?? u.email ?? "Unnamed" }));
  return (
    <div className="space-y-6">
      <Card>
        <p className="border-b border-line px-5 py-3 text-sm font-semibold">Invite a counselor or admin</p>
        <InviteForm />
        {(invites ?? []).length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {(invites ?? []).map((i) => {
              const joined = users.some((u) => u.email?.toLowerCase() === i.email);
              return (
                <li key={i.email} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="flex-1">{i.full_name ?? i.email} <span className="text-slate-500">· {i.email}</span></span>
                  <Badge tone={joined ? "emerald" : "amber"}>{joined ? "Joined" : "Waiting for sign-up"}</Badge>
                  <span className="text-xs capitalize text-slate-500">{i.role}</span>
                  <DeleteButton action={removeInvite.bind(null, i.email)} label={i.email} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card className="divide-y divide-line">
        {users.map((u) => <UserRow key={u.id} user={u} staff={staff} />)}
      </Card>
    </div>
  );
}

async function QuestionsTab({ supabase }: { supabase: Client }) {
  const data = await fetchAll<{ skill: string; source: string; verified: boolean }>((from, to) =>
    supabase.from("sat_questions").select("skill, source, verified").order("id").range(from, to),
  );
  const counts = new Map<string, number>();
  for (const q of data ?? []) counts.set(q.skill, (counts.get(q.skill) ?? 0) + 1);
  const skills = (Object.keys(SAT_TAXONOMY) as Section[]).flatMap((section) =>
    Object.entries(SAT_TAXONOMY[section].domains).flatMap(([domain, list]) => list.map((skill) => ({ section, domain, skill }))),
  );
  const bySource = (source: string) => (data ?? []).filter((q) => q.source === source).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <p className="border-b border-line px-5 py-3 text-sm font-semibold">
          {data?.length ?? 0} questions · {bySource("original")} original · {bySource("ai")} AI-generated · {bySource("imported")} imported
        </p>
        <ul className="divide-y divide-line">
          {skills.map((s) => (
            <li key={s.skill} className="flex items-center gap-3 px-5 py-2 text-sm">
              <span className="w-10 text-xs text-slate-400">{s.section === "rw" ? "R&W" : "Math"}</span>
              <span className="flex-1 truncate">{s.skill}</span>
              <span className={`tabular-nums ${counts.get(s.skill) ? "text-slate-700" : "text-rose-600"}`}>{counts.get(s.skill) ?? 0}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="space-y-6">
        <QuestionGenerator skills={skills} />
        <QuestionImporter />
      </div>
    </div>
  );
}

async function ResultsTab({ supabase }: { supabase: Client }) {
  const [{ data: results }, unis] = await Promise.all([
    supabase.from("admission_results").select("*").order("created_at", { ascending: false }),
    fetchAll<{ name: string }>((from, to) => supabase.from("universities").select("name").order("name").order("id").range(from, to)),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="h-fit divide-y divide-line">
        {(results ?? []).map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
            <span className="flex-1 truncate"><strong>{r.university_name}</strong> · {r.student_name}{r.class_year ? ` · ${r.class_year}` : ""}</span>
            {r.scholarship && <Badge tone="emerald">{r.scholarship}</Badge>}
            <DeleteButton action={deleteResult.bind(null, r.id)} label={`${r.student_name} – ${r.university_name}`} />
          </div>
        ))}
        {!results?.length && <p className="px-5 py-6 text-sm text-slate-500">No results yet. Admits you add appear at the top of the Universities page.</p>}
      </Card>
      <ResultForm universities={unis.map((u) => u.name)} />
    </div>
  );
}
