import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { buildSnapshot, type ProfileSnapshot, type ReviewSectionKey } from "@/lib/application";
import { PROFILE_CHECKS, type ProfileFacts } from "@/lib/readiness";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { SnapshotView } from "@/components/profile/snapshot-view";
import { HonorsEditor, ProfileForm, SendForReview } from "./profile-client";

export const metadata = { title: "My application" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const profile = await requireProfile();
  const { view } = await searchParams;
  const supabase = await createClient();

  const [snapshot, { data: honors }, { data: counselors }, { data: reviews }] = await Promise.all([
    buildSnapshot(supabase, profile.id),
    supabase.from("honors").select("*").eq("user_id", profile.id).order("created_at"),
    supabase.from("profiles").select("id, full_name").in("role", ["counselor", "admin"]).order("full_name"),
    supabase
      .from("profile_reviews")
      .select("id, status, student_note, overall_feedback, section_feedback, created_at, reviewed_at, counselor:profiles!profile_reviews_counselor_id_fkey(full_name)")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const facts: ProfileFacts = {
    profile,
    scores: snapshot.tests.length,
    activities: snapshot.activities.length,
    honors: snapshot.honors.length,
    essaysWithWords: snapshot.essays.filter((e) => e.words > 0).length,
    recommenders: snapshot.letters.length,
  };
  const checks = PROFILE_CHECKS(facts);
  const done = checks.filter((c) => c.done).length;
  type ReviewRow = { id: string; status: string; student_note: string | null; overall_feedback: string | null; section_feedback: Record<string, string>; created_at: string; reviewed_at: string | null; counselor: { full_name: string | null } | null };
  const history = (reviews ?? []) as unknown as ReviewRow[];
  const latestReviewed = history.find((r) => r.status === "reviewed");
  const pending = history.find((r) => r.status === "submitted");
  const preview = view === "preview";
  const p = profile;

  return (
    <>
      <PageHeader
        title="My application"
        description="Everything a university will see, in one place. Fill it in, preview it the way your counsellor will, and send it for review."
        action={
          <div className="flex rounded-md border border-line bg-white p-0.5 text-sm">
            <Link href="/profile" className={cn("rounded px-3 py-1.5", !preview ? "bg-navy text-white" : "text-slate-600")}>Edit</Link>
            <Link href="/profile?view=preview" className={cn("rounded px-3 py-1.5", preview ? "bg-navy text-white" : "text-slate-600")}>Preview</Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {preview ? (
            <SnapshotView snapshot={snapshot} feedback={(latestReviewed?.section_feedback ?? {}) as Partial<Record<ReviewSectionKey, string>>} />
          ) : (
            <>
              <ProfileForm
                initial={{
                  full_name: p.full_name ?? "",
                  grade_level: p.grade_level,
                  school_name: p.school_name ?? "",
                  intended_major: p.intended_major ?? "",
                  gpa: p.gpa ?? "",
                  class_rank: p.class_rank ?? "",
                  rigor_notes: p.rigor_notes ?? "",
                  spike_statement: p.spike_statement ?? "",
                  target_regions: p.target_regions,
                }}
              />
              <HonorsEditor honors={honors ?? []} />
              <LinkedSections snapshot={snapshot} />
            </>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardHeader title="Completeness" description={`${done} of ${checks.length} · ${Math.round((done / checks.length) * 100)}%`} />
            <div className="px-5 pt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done / checks.length) * 100}%` }} />
              </div>
            </div>
            <ul className="space-y-1.5 p-5 text-sm">
              {checks.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2", c.done ? "text-slate-500" : "text-navy")}>
                  {c.done ? <Check className="size-4 text-emerald-600" /> : <Circle className="size-4 text-slate-300" />}
                  {c.label}
                </li>
              ))}
            </ul>
          </Card>

          <SendForReview counselors={counselors ?? []} defaultCounselorId={profile.assigned_counselor_id} pending={Boolean(pending)} completeness={done / checks.length} />

          {history.length > 0 && (
            <Card>
              <CardHeader title="Reviews" />
              <ul className="divide-y divide-line">
                {history.map((r) => (
                  <li key={r.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge tone={r.status === "reviewed" ? "emerald" : "indigo"}>{r.status === "reviewed" ? "Feedback ready" : "Waiting"}</Badge>
                      <span className="text-xs text-slate-500">{r.counselor?.full_name} · {formatDateTime(r.created_at)}</span>
                    </div>
                    {r.overall_feedback && <p className="mt-2 whitespace-pre-wrap text-slate-700">{r.overall_feedback}</p>}
                    {r.status === "reviewed" && Object.keys(r.section_feedback ?? {}).length > 0 && (
                      <Link href="/profile?view=preview" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
                        See comments on each section <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function LinkedSections({ snapshot }: { snapshot: ProfileSnapshot }) {
  const items = [
    { title: "Test scores", detail: snapshot.tests.length ? snapshot.tests.map((t) => `${t.type} ${t.best}`).join(" · ") : "None logged", href: "/testing" },
    { title: "Activities", detail: `${snapshot.activities.length} of 10`, href: "/activities" },
    { title: "Essays", detail: snapshot.essays.length ? `${snapshot.essays.length} · ${snapshot.essays.filter((e) => e.status === "completed").length} revised` : "None yet", href: "/essays" },
    { title: "Recommendation letters", detail: snapshot.letters.length ? `${snapshot.letters.filter((l) => l.status === "submitted").length} of ${snapshot.letters.length} submitted` : "No recommenders yet", href: "/recommenders" },
  ];
  return (
    <Card>
      <CardHeader title="Also part of your application" description="These have their own pages. Updates appear here and in what you send." />
      <ul className="divide-y divide-line">
        {items.map((i) => (
          <li key={i.title}>
            <Link href={i.href} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span className="flex-1 text-sm font-medium">{i.title}</span>
              <span className="text-sm text-slate-500">{i.detail}</span>
              <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
