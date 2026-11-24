import Link from "next/link";
import { Check, GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-navy text-white">
            <GraduationCap className="size-4" />
          </span>
          <span className="text-sm font-semibold">Admissions Prep</span>
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
      </div>

      <div className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-accent/40 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Grades 9–12</p>
        <div className="relative">
          <h2 className="max-w-md font-serif text-5xl font-medium leading-[1.08]">Be the student the admissions team is missing.</h2>
          <ul className="mt-8 space-y-3 text-[15px] text-slate-200">
            {[
              "A roadmap for your grade, one task at a time",
              "Daily SAT practice with explanations for every choice",
              "Essay feedback from your counsellor, in one place",
              "Real acceptance rates and SAT ranges for 1,464 universities",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">Free for students. Your data stays private to you and your counsellor.</p>
      </div>
    </div>
  );
}
