import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Flame,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Mail,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: LayoutDashboard, title: "A roadmap for every grade", body: "From Grade 9 to decision day: the right task at the right time, with readiness tracking for essays, testing, activities and letters." },
  { icon: PenLine, title: "Essay Studio with your counsellor", body: "Write with frameworks beside you, send drafts for paragraph-level feedback, and walk through them together in Meeting View." },
  { icon: ListChecks, title: "Daily SAT practice", body: "Questions in the real Digital SAT format, explanations for every choice, a mistake review queue, streaks, and official question banks built in." },
  { icon: Building2, title: "1,464 universities, real numbers", body: "Acceptance rates, SAT ranges, costs and Times Higher Education rankings, plus deadlines researched for the top 90 worldwide." },
  { icon: Target, title: "Know where you stand", body: "See if each university is a reach, target or likely for your scores, and how an admissions reader might rate your file." },
  { icon: BookOpen, title: "Guides that explain the game", body: "How to build a spike, which activities count, how to earn strong letters, and how to write essays readers remember." },
];

const STEPS = [
  { title: "Tell us your grade", body: "Your roadmap, readiness and deadlines adjust to where you are now." },
  { title: "Do a little every day", body: "A daily practice set, one roadmap task, one paragraph. Streaks keep you moving." },
  { title: "Apply knowing your odds", body: "A balanced list, essays reviewed by your counsellor, and letters full of real moments." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-navy text-white">
              <GraduationCap className="size-4" />
            </span>
            <span className="text-sm font-semibold">Admissions Prep</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-navy">Features</a>
            <a href="#how" className="hover:text-navy">How it works</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="h-9 rounded-md px-3.5 text-sm font-medium leading-9 text-slate-700 hover:bg-white">Sign in</Link>
            <Link href="/signup" className="h-9 rounded-md bg-navy px-3.5 text-sm font-medium leading-9 text-white hover:bg-slate-800">Get started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3ea_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Fall 2027 deadlines are live
            </p>
            <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
              Your way into the university you <em className="text-accent">actually</em> want.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              One place to plan from Grade 9, practise the SAT every day, write essays with your counsellor, and understand exactly how admissions officers read your file.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="group inline-flex h-12 items-center gap-2 rounded-md bg-navy px-6 text-sm font-semibold text-white hover:bg-slate-800">
                Start free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className="inline-flex h-12 items-center rounded-md border border-line bg-white px-6 text-sm font-semibold hover:bg-slate-50">
                I have an account
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {["Free for students", "Built for international applicants", "Works with your school counsellor"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-emerald-600" />{t}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.15}>
            <ProductPreview />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-line md:grid-cols-4">
          {[
            ["1,464", "universities with real admissions data"],
            ["90", "top universities with researched deadlines"],
            ["30", "Digital SAT skills tracked"],
            ["20+", "guides on essays, activities and letters"],
          ].map(([n, label]) => (
            <div key={label} className="px-5 py-8">
              <p className="font-serif text-4xl font-medium tabular-nums">{n}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Everything in one place</p>
          <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">Built around how admissions really works</h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05} className="bg-white p-7">
              <f.icon className="size-5 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">How it works</p>
            <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">Small steps, every day, from Grade 9</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <p className="font-serif text-6xl font-medium text-indigo-100">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-navy px-8 py-14 text-white md:px-14">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-accent/30 blur-3xl" />
            <h2 className="relative max-w-2xl font-serif text-4xl font-medium leading-tight md:text-5xl">The best time to start was Grade 9. The second best is today.</h2>
            <Link href="/signup" className="group relative mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-navy hover:bg-slate-100">
              Create your free account
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-8 text-xs leading-relaxed text-slate-500">
          Rankings: Times Higher Education World University Rankings 2027. U.S. admissions data: U.S. Department of Education College Scorecard.
          Guides credit Stoic Edu, College Essay Guy and Hack the College Essay where their methods are used. SAT is a trademark of the College Board, which is not affiliated with this site.
        </div>
      </footer>
    </div>
  );
}

/** A static composition of real UI pieces from inside the app. */
function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-indigo-100/70 via-transparent to-sky-100/60 blur-2xl" />
      <div className="rounded-xl border border-line bg-white p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Today</p>
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">Grade 11</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-line p-3">
            <p className="flex items-center gap-1 text-[11px] text-slate-500"><Flame className="size-3 text-orange-500" />Streak</p>
            <p className="mt-1 text-2xl font-semibold">12<span className="text-xs font-normal text-slate-500"> days</span></p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-[11px] text-slate-500">Today</p>
            <p className="mt-1 text-2xl font-semibold">8<span className="text-xs font-normal text-slate-500">/10</span></p>
            <div className="mt-1.5 h-1 rounded-full bg-slate-100"><div className="h-full w-4/5 rounded-full bg-accent" /></div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-[11px] text-slate-500">Reviews due</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">3</p>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-500">Example student · SAT 1490</p>
        <div className="mt-1.5 rounded-lg border border-line">
          {[
            ["Massachusetts Institute of Technology", "4.6%", "1520–1580", "Reach", "bg-rose-50 text-rose-700"],
            ["University of Illinois Urbana-Champaign", "42.4%", "1310–1520", "Target", "bg-indigo-50 text-indigo-700"],
            ["Purdue University", "49.9%", "1200–1480", "Likely", "bg-emerald-50 text-emerald-700"],
          ].map(([name, rate, sat, fit, tone]) => (
            <div key={name} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{name}</p>
                <p className="text-[11px] text-slate-500">{rate} accepted · SAT {sat}</p>
              </div>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${tone}`}>{fit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-8 -left-6 hidden w-56 rounded-xl border border-line bg-white p-4 shadow-lg sm:block">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent"><Sparkles className="size-3" />Counsellor feedback</p>
        <p className="mt-2 font-serif text-sm italic leading-snug text-slate-700">"Your opening is strong. Move the grandmother scene to paragraph two."</p>
      </div>
      <div className="absolute -right-4 -top-6 hidden rounded-xl border border-line bg-white px-4 py-3 shadow-lg sm:block">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Mail className="size-3" />UCAS deadline</p>
        <p className="text-sm font-semibold">13 Jan 2027 · <span className="text-amber-600">{Math.max(0, daysUntil("2027-01-13"))} days</span></p>
      </div>
    </div>
  );
}
