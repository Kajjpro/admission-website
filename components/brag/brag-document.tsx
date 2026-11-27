import { HONOR_LEVELS } from "@/lib/application";
import { BRAG_QUESTIONS, type BragData } from "@/lib/brag-sheet";
import { formatDate } from "@/lib/utils";

/** The brag sheet as a teacher reads it. Print-friendly: one column, no app chrome. */
export function BragDocument({ data }: { data: BragData }) {
  const s = data.student;
  const answered = BRAG_QUESTIONS.filter((q) => data.answers[q.id]?.trim());
  const facts = [
    s.grade ? `Grade ${s.grade}` : null,
    s.school,
    s.major ? `Hopes to study ${s.major}` : null,
  ].filter(Boolean);

  return (
    <article className="rounded-lg border border-line bg-white p-6 sm:p-10 print:border-0 print:p-0">
      <header className="border-b border-line pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Brag sheet</p>
        <h1 className="mt-2 font-serif text-3xl font-medium">{s.name ?? "Student"}</h1>
        {facts.length > 0 && <p className="mt-1 text-sm text-slate-600">{facts.join(" · ")}</p>}
        {s.email && <p className="mt-0.5 text-sm text-slate-500">{s.email}</p>}
        {data.recommender && (
          <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm print:bg-transparent print:px-0">
            <p>
              For <span className="font-medium">{data.recommender.name}</span>
              {data.recommender.subject ? ` (${data.recommender.subject})` : ""}
              {data.recommender.due_date ? ` · letter due ${formatDate(data.recommender.due_date)}` : ""}
            </p>
            {data.recommender.context && <p className="mt-1 text-slate-600">How we know each other: {data.recommender.context}</p>}
          </div>
        )}
      </header>

      {s.spike && (
        <Block title="In one line">
          <p className="font-serif text-lg italic">"{s.spike}"</p>
        </Block>
      )}

      {data.recommender?.notes && (
        <Block title="Moments from your class">
          <p className="whitespace-pre-wrap">{data.recommender.notes}</p>
        </Block>
      )}

      {answered.length > 0 && (
        <Block title="In my own words">
          <dl className="space-y-4">
            {answered.map((q) => (
              <div key={q.id} className="break-inside-avoid">
                <dt className="font-medium">{q.q}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-700">{data.answers[q.id]}</dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {data.activities.length > 0 && (
        <Block title="Activities">
          <ol className="space-y-3">
            {data.activities.map((a, i) => (
              <li key={i} className="break-inside-avoid">
                <p className="font-medium">
                  {a.role}
                  {a.organization && <span className="font-normal text-slate-500">, {a.organization}</span>}
                </p>
                {a.description && <p className="text-slate-700">{a.description}</p>}
                <p className="text-xs text-slate-500">
                  {[a.grades?.length ? `Grades ${a.grades.join(", ")}` : null, a.hours ? `${a.hours} hr/wk` : null, a.weeks ? `${a.weeks} wk/yr` : null].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {(data.honors.length > 0 || data.tests.length > 0 || s.gpa || s.rigor) && (
        <Block title="Academics and honours">
          <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2">
            {s.gpa && (<><dt className="text-slate-500">Grades</dt><dd>{s.gpa}{s.class_rank ? ` · rank ${s.class_rank}` : ""}</dd></>)}
            {s.rigor && (<><dt className="text-slate-500">Hardest courses</dt><dd className="whitespace-pre-wrap">{s.rigor}</dd></>)}
            {data.tests.length > 0 && (<><dt className="text-slate-500">Tests</dt><dd>{data.tests.map((t) => `${t.type} ${Number(t.best)}`).join(" · ")}</dd></>)}
            {data.honors.length > 0 && (
              <>
                <dt className="text-slate-500">Honours</dt>
                <dd>
                  <ul className="space-y-1">
                    {data.honors.map((h, i) => (
                      <li key={i}>{h.title}<span className="text-slate-500"> · {HONOR_LEVELS[h.level] ?? h.level}{h.grade ? `, grade ${h.grade}` : ""}</span></li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
          </dl>
        </Block>
      )}

      {data.universities.length > 0 && (
        <Block title={`Applying to (${data.universities.length})`}>
          <ul className="columns-1 gap-6 sm:columns-2">
            {data.universities.map((u, i) => (
              <li key={i} className="break-inside-avoid py-0.5">
                {u.name}
                <span className="text-slate-500"> · {u.country}{u.round ? ` · ${u.round}` : ""}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {!answered.length && !data.activities.length && !s.spike && !data.honors.length && !data.tests.length && !data.universities.length && !data.recommender?.notes && (
        <p className="pt-6 text-sm text-slate-500">Nothing filled in yet.</p>
      )}
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-6 text-sm last:border-0 last:pb-0">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}
