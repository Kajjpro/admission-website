import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { getPracticeStats } from "@/lib/practice";
import { SAT_TAXONOMY, type Section } from "@/lib/sat";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { OfficialLinks } from "@/components/practice/official-links";
import { TodayCard } from "@/components/practice/today-card";
import { cn } from "@/lib/utils";
import { CustomSetBuilder, GoalSetter } from "./practice-client";

export const metadata = { title: "SAT practice" };

export default async function PracticePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [stats, bank] = await Promise.all([
    getPracticeStats(supabase, profile.id),
    fetchAll<{ skill: string }>((from, to) => supabase.from("sat_questions").select("skill").eq("verified", true).order("id").range(from, to)),
  ]);

  const bankBySkill = new Map<string, number>();
  for (const q of bank) bankBySkill.set(q.skill, (bankBySkill.get(q.skill) ?? 0) + 1);
  const statsBySkill = new Map(stats.bySkill.map((s) => [s.skill, s]));
  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;

  return (
    <>
      <PageHeader
        title="SAT practice"
        description={`${bank.length} questions across every Digital SAT skill. Missed questions come back for review until you get them right three times.`}
        action={
          <div className="flex gap-2">
            <Link href="/practice/official" className="inline-flex h-9 items-center rounded-md bg-navy px-3.5 text-sm font-medium text-white hover:bg-slate-800">
              Official questions
            </Link>
            {aiConfigured() && (
            <Link href="/practice/tutor" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-white px-3.5 text-sm font-medium hover:bg-slate-50">
              <Sparkles className="size-4 text-accent" />
              Ask the AI tutor
            </Link>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        <TodayCard stats={stats} goal={profile.daily_goal} />

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {(Object.keys(SAT_TAXONOMY) as Section[]).map((section) => (
              <Card key={section}>
                <CardHeader
                  title={SAT_TAXONOMY[section].label}
                  action={<Link href={`/practice/session?section=${section}`} className="text-xs font-medium text-accent">Practice all</Link>}
                />
                <div className="divide-y divide-line">
                  {Object.entries(SAT_TAXONOMY[section].domains).map(([domain, skills]) => (
                    <div key={domain} className="px-5 py-3">
                      <Link href={`/practice/session?domain=${encodeURIComponent(domain)}`} className="text-sm font-semibold hover:text-accent">{domain}</Link>
                      <ul className="mt-2 space-y-1.5">
                        {skills.map((skill) => {
                          const s = statsBySkill.get(skill);
                          const pct = s ? Math.round((s.correct / s.attempts) * 100) : null;
                          const available = bankBySkill.get(skill) ?? 0;
                          return (
                            <li key={skill} className="grid grid-cols-[minmax(0,1fr)_90px_44px] items-center gap-3 text-sm">
                              {available ? (
                                <Link href={`/practice/session?skill=${encodeURIComponent(skill)}`} className="truncate text-slate-700 hover:text-accent">{skill}</Link>
                              ) : (
                                <span className="truncate text-slate-400" title="No questions yet">{skill}</span>
                              )}
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                {pct !== null && (
                                  <div className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-accent" : "bg-amber-500")} style={{ width: `${Math.max(pct, 4)}%` }} />
                                )}
                              </div>
                              <span className="text-right text-xs tabular-nums text-slate-500">{pct === null ? `${available}q` : `${pct}%`}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <p className="text-xs text-slate-500">All-time</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.total} <span className="text-sm font-normal text-slate-500">answered</span></p>
              <p className="text-sm text-slate-500">{accuracy === null ? "No attempts yet" : `${accuracy}% correct`}</p>
            </Card>
            <CustomSetBuilder />
            <OfficialLinks />
            <GoalSetter goal={profile.daily_goal} />
            {profile.role !== "student" && (
              <Card className="p-5 text-sm">
                <p className="font-medium">Grow the bank</p>
                <p className="mt-1 text-slate-500">Generate verified questions for any skill from Content & users → Question bank, or fill every skill at once with <code className="text-xs">npm run bank:generate</code>.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
