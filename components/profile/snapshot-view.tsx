import { MessageSquare } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { ESSAY_TYPES, IMPACT_CATEGORIES, RECOMMENDER_STATUS, REVIEW_STATUS } from "@/lib/constants";
import { HONOR_LEVELS, type ProfileSnapshot, type ReviewSectionKey } from "@/lib/application";
import type { EssayType, ImpactCategory, RecommenderStatus, ReviewStatus } from "@/lib/types";

function Section({
  title,
  feedback,
  empty,
  children,
}: {
  title: string;
  feedback?: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-5 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="px-5 py-4 text-sm">{empty ? <p className="text-slate-400">Not filled in yet.</p> : children}</div>
      {feedback && (
        <div className="flex gap-2 border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-950">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="whitespace-pre-wrap">{feedback}</p>
        </div>
      )}
    </Card>
  );
}

export function SnapshotView({ snapshot, feedback = {} }: { snapshot: ProfileSnapshot; feedback?: Partial<Record<ReviewSectionKey, string>> }) {
  const s = snapshot;
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="font-serif text-2xl font-medium">{s.student.name ?? "Student"}</p>
        <p className="mt-1 text-sm text-slate-500">
          {[s.student.grade ? `Grade ${s.student.grade}` : null, s.student.school, s.student.intendedMajor && `Intends ${s.student.intendedMajor}`].filter(Boolean).join(" · ")}
        </p>
        {s.student.regions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">{s.student.regions.map((r) => <Badge key={r}>{r}</Badge>)}</div>
        )}
      </Card>

      <Section title="Spike" feedback={feedback.spike} empty={!s.spike}>
        <p className="font-serif text-lg italic">"{s.spike}"</p>
      </Section>

      <Section title="Academics" feedback={feedback.academics} empty={!s.academics.gpa && !s.academics.rigor}>
        <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2">
          {s.academics.gpa && (<><dt className="text-slate-500">Grades</dt><dd>{s.academics.gpa}</dd></>)}
          {s.academics.classRank && (<><dt className="text-slate-500">Class rank</dt><dd>{s.academics.classRank}</dd></>)}
          {s.academics.rigor && (<><dt className="text-slate-500">Hardest courses</dt><dd className="whitespace-pre-wrap">{s.academics.rigor}</dd></>)}
        </dl>
      </Section>

      <Section title="Testing" feedback={feedback.testing} empty={!s.tests.length}>
        <div className="flex flex-wrap gap-3">
          {s.tests.map((t) => (
            <div key={t.type} className="rounded-md border border-line px-3 py-2">
              <p className="text-xs text-slate-500">{t.type} best · {t.attempts} attempt{t.attempts > 1 ? "s" : ""}</p>
              <p className="text-lg font-semibold tabular-nums">{t.best} {t.official && <Badge tone="indigo">Official</Badge>}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Activities (${s.activities.length})`} feedback={feedback.activities} empty={!s.activities.length}>
        <ol className="space-y-3">
          {s.activities.map((a, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-4 text-right font-semibold tabular-nums text-slate-300">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-medium">
                  {a.role || "Untitled role"}
                  <span className="font-normal text-slate-500">{a.organization ? `, ${a.organization}` : ""}</span>
                  {a.impact && <Badge tone="indigo" className="ml-2">{IMPACT_CATEGORIES[a.impact as ImpactCategory]}</Badge>}
                </p>
                <p className="text-slate-700">{a.description}</p>
                <p className="text-xs text-slate-500">{a.type} · Grades {a.grades.join(", ") || "—"} · {a.hours} hr/wk · {a.weeks} wk/yr</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={`Honours (${s.honors.length})`} feedback={feedback.honors} empty={!s.honors.length}>
        <ul className="space-y-2">
          {s.honors.map((h, i) => (
            <li key={i}>
              <span className="font-medium">{h.title}</span>
              <span className="text-slate-500"> · {HONOR_LEVELS[h.level] ?? h.level}{h.grade ? ` · Grade ${h.grade}` : ""}</span>
              {h.description && <p className="text-slate-600">{h.description}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`Essays (${s.essays.length})`} feedback={feedback.essays} empty={!s.essays.length}>
        <ul className="divide-y divide-line">
          {s.essays.map((e, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="flex-1 truncate">{e.title}</span>
              <span className="text-xs text-slate-500">{ESSAY_TYPES[e.type as EssayType]?.label} · {e.words}{e.limit ? `/${e.limit}` : ""} words</span>
              <Badge tone={REVIEW_STATUS[e.status as ReviewStatus]?.tone}>{REVIEW_STATUS[e.status as ReviewStatus]?.label}</Badge>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={`Letters (${s.letters.length})`} feedback={feedback.letters} empty={!s.letters.length}>
        <ul className="divide-y divide-line">
          {s.letters.map((l, i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="flex-1">{l.name}<span className="text-slate-500">{l.subject ? ` · ${l.subject}` : ""}</span></span>
              <Badge tone={RECOMMENDER_STATUS[l.status as RecommenderStatus]?.tone}>{RECOMMENDER_STATUS[l.status as RecommenderStatus]?.label}</Badge>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
