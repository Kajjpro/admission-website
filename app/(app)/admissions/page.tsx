import Link from "next/link";
import { ArrowRight, BookOpen, FileText, GraduationCap, Mail, MessageSquare, School, Target, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui";
import { ReaderSimulator } from "./reader-simulator";
import { ScoreComparison, type ComparedUniversity } from "./score-comparison";

export const metadata = { title: "How admissions works" };

const JOURNEY = [
  { title: "You submit", body: "Application, essays, activities list, honours and self-reported scores go in through the Common App or the college's own portal." },
  { title: "Your school sends its part", body: "Transcript, school profile, counsellor letter and two teacher letters. The school profile tells readers what your school offers and how it grades." },
  { title: "Your file is assembled", body: "The office matches every document to you. Missing pieces delay review, so check each college's applicant portal after you submit." },
  { title: "First read", body: "At many selective colleges, an officer responsible for your country or region reads the whole file, writes a summary and gives ratings." },
  { title: "Second read or committee", body: "Another reader, or a committee, discusses strong files. Your regional officer often presents your case and argues for you." },
  { title: "Shaping the class", body: "Final decisions balance the whole class: intended majors, talents, backgrounds, regions and, for most colleges, the financial aid budget." },
];

const FILE_PARTS = [
  { icon: School, title: "Transcript and course rigor", learn: "Did you take the hardest courses your school offers, and do well in them? Usually the single most important part.", href: "/dashboard", cta: "Your roadmap" },
  { icon: Target, title: "Test scores", learn: "SAT/ACT where required or submitted, and IELTS/TOEFL to show you can study in English.", href: "/practice", cta: "SAT practice" },
  { icon: Trophy, title: "Activities and honours", learn: "Depth, initiative and impact. One spike with reach beats ten shallow clubs.", href: "/guides/good-vs-bad-activities", cta: "Good vs. bad activities" },
  { icon: FileText, title: "Essays", learn: "Your voice and how you think. The only place the reader hears you directly.", href: "/essays", cta: "Essay Studio" },
  { icon: Mail, title: "Recommendation letters", learn: "Specific moments from teachers who watched you work, plus your counsellor's view of you against your class.", href: "/recommenders", cta: "Letters" },
  { icon: MessageSquare, title: "Interview (sometimes)", learn: "Optional at most colleges, often with an alumnus. It rarely makes a decision, but it can add warmth and detail.", href: "/guides", cta: "Guides" },
];

const SCALE = [
  {
    category: "Academic",
    levels: ["Exceptional scholar: top grades in the hardest courses, unusual intellectual depth", "Excellent student with top grades and scores", "Good student with solid grades and scores", "Adequate preparation"],
  },
  {
    category: "Extracurricular",
    levels: ["Truly unusual achievement, often national or international recognition", "Unusual strength, often local or regional recognition", "Solid participation without special distinction", "Little or no participation"],
  },
  {
    category: "Personal",
    levels: ["Outstanding character and maturity, seen across letters and essays", "Very strong personal qualities", "Generally positive", "Bland or somewhat immature"],
  },
];

const DECISIONS = [
  { name: "Admit", tone: "bg-emerald-50 text-emerald-800 border-emerald-200", body: "You're in. Compare aid offers, then reply by the deposit deadline (usually May 1 for U.S. colleges)." },
  { name: "Defer", tone: "bg-sky-50 text-sky-800 border-sky-200", body: "Early applicants only. You're moved to the regular round and read again. Send real updates if the college invites them." },
  { name: "Waitlist", tone: "bg-amber-50 text-amber-800 border-amber-200", body: "Not yet. Accept a spot on the list if you'd attend, commit elsewhere anyway, and send one short update." },
  { name: "Deny", tone: "bg-slate-100 text-slate-700 border-slate-200", body: "Not this year. At colleges admitting under 10%, most strong applicants hear this. It measures the class, not your worth." },
];

const ROUNDS = [
  { name: "Early Decision (ED)", when: "Apply ~Nov 1, hear ~mid-Dec", rule: "Binding: if admitted with enough aid, you must attend. Apply ED to one college only." },
  { name: "Early Action (EA)", when: "Apply ~Nov 1, hear Dec–Feb", rule: "Not binding. Apply to as many EA colleges as you like." },
  { name: "Restrictive / Single-Choice EA", when: "Apply ~Nov 1, hear ~mid-Dec", rule: "Not binding, but limits other private early applications (Harvard, Yale, Princeton, Stanford)." },
  { name: "Regular Decision (RD)", when: "Apply ~Jan 1–15, hear late March", rule: "Not binding. Where most of your list will sit." },
];

const MYTHS = [
  ["A perfect SAT gets you in.", "At the most selective colleges, most applicants have excellent scores. Scores open the door; the rest of the file decides."],
  ["Readers want well-rounded students.", "They want a well-rounded class of students who are each unusually strong at something."],
  ["More activities look better.", "Readers weigh depth, initiative and reach. Ten shallow clubs can read weaker than three deep ones."],
  ["Coming from a small school hurts you.", "You're read in the context of what your school offered. Doing a lot with a little is a strength."],
  ["Asking for financial aid never matters.", "For international students most colleges are need-aware, so plan a balanced list with aid in mind."],
];

export default async function AdmissionsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [scores, activities, recs, list] = await Promise.all([
    supabase.from("test_scores").select("test_type, total_score").eq("user_id", profile.id),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("recommenders").select("status").eq("user_id", profile.id),
    supabase.from("user_universities").select("universities(id, name, sat_25, sat_75, acceptance_rate)").eq("user_id", profile.id),
  ]);
  const best = (type: string) => {
    const values = (scores.data ?? []).filter((s) => s.test_type === type).map((s) => Number(s.total_score));
    return values.length ? Math.max(...values) : null;
  };
  const compared = ((list.data ?? []) as unknown as { universities: ComparedUniversity | null }[])
    .map((r) => r.universities)
    .filter((u): u is ComparedUniversity => Boolean(u?.sat_25 && u.sat_75));

  return (
    <div className="space-y-20 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white px-6 py-14 md:px-12 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Reveal className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Admissions, explained</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">What happens after you click submit</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Selective universities don't add up points. People read your whole file, rate it, compare it with others like it, and build a class.
            Here's exactly how, and where you stand.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Read in context", "Compared with your school first", "Rated on a scale", "Decided as a class"].map((t) => (
              <span key={t} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-slate-700">{t}</span>
            ))}
          </div>
        </Reveal>
      </section>

      <Section number="01" title="The journey of your file" intro="Six steps between your submit button and the decision email.">
        <ol className="relative grid gap-4 md:grid-cols-3">
          {JOURNEY.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.06}>
              <Card className="h-full p-5">
                <span className="grid size-8 place-items-center rounded-full bg-navy text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </Card>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section number="02" title="What's in your file" intro="Every part answers a different question. Here's what each one tells a reader, and where you build it in this app.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FILE_PARTS.map((part, i) => (
            <Reveal key={part.title} delay={i * 0.05}>
              <Link href={part.href} className="group block h-full">
                <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-sm">
                  <part.icon className="size-5 text-accent" />
                  <h3 className="mt-3 font-semibold">{part.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{part.learn}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    {part.cta}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        number="03"
        title="How readers rate you"
        intro="Many selective colleges turn a file into a few ratings. Harvard's process, described in the U.S. Supreme Court's 2023 SFFA opinion, rates applicants from 1 (best) to 6 in academic, extracurricular, athletic and personal categories, then gives an overall rating. Below is a simplified version of the top four levels."
      >
        <Reveal>
          <Card className="overflow-x-auto">
            <div className="min-w-[720px]">
            <div className="grid grid-cols-[120px_repeat(4,minmax(0,1fr))] border-b border-line bg-slate-50 text-xs font-semibold text-slate-500">
              <span className="px-4 py-3">Category</span>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className="px-4 py-3">
                  <span className={`mr-1.5 inline-grid size-5 place-items-center rounded-full text-[11px] text-white ${n === 1 ? "bg-emerald-600" : n === 2 ? "bg-accent" : n === 3 ? "bg-amber-500" : "bg-slate-400"}`}>{n}</span>
                  {n === 1 ? "Rare" : n === 2 ? "Strong" : n === 3 ? "Solid" : "Adequate"}
                </span>
              ))}
            </div>
            {SCALE.map((row) => (
              <div key={row.category} className="grid grid-cols-[120px_repeat(4,minmax(0,1fr))] border-b border-line last:border-0">
                <span className="px-4 py-4 text-sm font-semibold">{row.category}</span>
                {row.levels.map((l, i) => (
                  <span key={i} className="px-4 py-4 text-sm leading-relaxed text-slate-600">{l}</span>
                ))}
              </div>
            ))}
            </div>
          </Card>
        </Reveal>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Reveal>
            <Card className="h-full p-5">
              <h3 className="font-semibold">Most admitted students are a "2" somewhere</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                A 1 is rare in any category. Strong applicants usually combine excellent academics with one category where they clearly stand out. That's why a spike matters more than being average-good at everything.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.05}>
            <Card className="h-full p-5">
              <h3 className="font-semibold">Every college publishes what it weighs</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Search "<em>[college name] Common Data Set</em>" and open section <strong>C7</strong>. It lists how much the college weighs rigor, grades, test scores, essays, letters, activities, talent and character: very important, important, considered, or not considered.
              </p>
            </Card>
          </Reveal>
        </div>
      </Section>

      <Section number="04" title="Who you're compared with" intro="You're never compared with every applicant at once. Readers move outward in three circles.">
        <div className="grid items-center gap-8 lg:grid-cols-[360px_1fr]">
          <Reveal>
            <div className="relative mx-auto aspect-square w-full max-w-[340px]">
              <div className="absolute inset-0 grid place-items-start justify-center rounded-full border border-indigo-200 bg-indigo-50/40 pt-5 text-xs font-semibold text-indigo-700">The whole class</div>
              <div className="absolute inset-[16%] grid place-items-start justify-center rounded-full border border-indigo-300 bg-indigo-100/50 pt-4 text-xs font-semibold text-indigo-800">Your country and region</div>
              <div className="absolute inset-[34%] grid place-items-center rounded-full bg-navy text-center text-xs font-semibold text-white">Your school</div>
            </div>
          </Reveal>
          <div className="space-y-4">
            {[
              ["1 · Your school", "Your counsellor letter and school profile show how you rank against classmates and whether you took the most rigorous courses available. You're judged against what your school offered, not against schools with more."],
              ["2 · Your country and region", "International files are usually read by an officer who knows your country's schools and exams. You're compared first with applicants from similar backgrounds, which is why context like a soum school or a national olympiad round needs a clear explanation."],
              ["3 · The whole class", "Finally, the committee shapes a class: future engineers and poets, athletes and researchers, students from many countries. Being the strength the class is missing is how a file wins at this stage."],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 0.06}>
                <Card className="p-5">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
                </Card>
              </Reveal>
            ))}
            <Reveal>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
                <strong>For international students: need-aware vs. need-blind.</strong> Most U.S. colleges consider whether an international applicant needs financial aid. Only a handful, including MIT, Harvard, Yale, Princeton, Dartmouth and Brown, are need-blind for everyone. Build a list that includes need-blind schools and schools where you could be a strong scholarship candidate.
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section number="05" title="Where would a reader place you?" intro="Answer honestly. This is a learning tool, not a prediction. It shows how the categories above might read your file today, and what would lift it most.">
        <ReaderSimulator
          name={profile.full_name?.split(" ")[0] ?? "You"}
          bestSat={best("SAT")}
          bestIelts={best("IELTS")}
          activityCount={activities.count ?? 0}
          submittedLetters={(recs.data ?? []).filter((r) => r.status === "submitted").length}
        />
      </Section>

      <Section number="06" title="You vs. admitted students" intro="The middle 50% SAT range of admitted students at the colleges on your list, with your best score marked. U.S. data from the Department of Education.">
        <ScoreComparison universities={compared} bestSat={best("SAT")} />
      </Section>

      <Section number="07" title="Rounds and decisions" intro="When you apply changes the rules, and there are four possible answers.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal>
            <Card className="divide-y divide-line">
              {ROUNDS.map((r) => (
                <div key={r.name} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    <span className="text-xs text-slate-500">{r.when}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{r.rule}</p>
                </div>
              ))}
            </Card>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {DECISIONS.map((d, i) => (
              <Reveal key={d.name} delay={i * 0.05}>
                <div className={`h-full rounded-lg border p-4 ${d.tone}`}>
                  <h3 className="font-serif text-xl font-medium">{d.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-90">{d.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section number="08" title="Myths that cost students" intro="What students often believe, and what readers actually do.">
        <div className="grid gap-3 md:grid-cols-2">
          {MYTHS.map(([myth, reality], i) => (
            <Reveal key={myth} delay={i * 0.04}>
              <Card className="h-full p-5">
                <p className="text-sm text-slate-400 line-through">{myth}</p>
                <p className="mt-2 text-[15px] leading-relaxed">{reality}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Reveal>
        <Card className="flex flex-col items-start gap-4 bg-navy p-8 text-white md:flex-row md:items-center">
          <GraduationCap className="size-8 shrink-0 text-indigo-300" />
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-medium">Now build the file a reader remembers</h2>
            <p className="mt-1 text-sm text-slate-300">Start with your spike, then your essays and letters.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/guides/good-vs-bad-activities" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-4 text-sm font-medium text-navy hover:bg-slate-100">
              <BookOpen className="size-4" />
              Activities guide
            </Link>
            <Link href="/resources" className="inline-flex h-10 items-center rounded-md border border-white/20 px-4 text-sm font-medium hover:bg-white/10">
              All resources
            </Link>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

function Section({ number, title, intro, children }: { number: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <section>
      <Reveal className="mb-6 max-w-3xl">
        <p className="font-mono text-xs text-accent">{number}</p>
        <h2 className="mt-1 font-serif text-3xl font-medium tracking-tight">{title}</h2>
        <p className="mt-2 leading-relaxed text-slate-600">{intro}</p>
      </Reveal>
      {children}
    </section>
  );
}
