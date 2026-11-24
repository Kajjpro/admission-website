"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Card } from "@/components/ui";
import type { Readiness } from "@/lib/readiness";
import { cn } from "@/lib/utils";

function Ring({ value, active }: { value: number; active: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = 28;
  const c = 2 * Math.PI * r;
  const color = pct >= 80 ? "#059669" : pct >= 40 ? "#4f46e5" : pct > 0 ? "#d97706" : "#cbd5e1";
  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#eef0f3" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (Math.max(0, Math.min(100, shown)) / 100) * c}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className={cn("absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums", active && "text-accent")}>{pct}%</span>
    </div>
  );
}

export function ReadinessPanel({ items }: { items: Readiness[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const current = items.find((i) => i.key === open);
  const overall = Math.round(items.reduce((a, i) => a + i.value, 0) / items.length);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Application readiness</h2>
          <p className="text-xs text-slate-500">Calculated live from your essays, scores, activities, letters and profile. Click a ring to see what counts.</p>
        </div>
        <p className="text-sm text-slate-500">Overall <span className="font-semibold tabular-nums text-navy">{overall}%</span></p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setOpen(open === item.key ? null : item.key)}
            className={cn("flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors", open === item.key ? "bg-accent-soft" : "hover:bg-slate-50")}
            aria-expanded={open === item.key}
          >
            <Ring value={item.value} active={open === item.key} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="truncate text-xs text-slate-500">{item.detail}</p>
            </div>
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {current && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="grid gap-4 border-t border-line bg-slate-50/70 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How {current.label.toLowerCase()} moves</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {current.rules.map((rule) => (
                    <li key={rule} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-slate-700">{rule}</li>
                  ))}
                </ul>
              </div>
              {current.next ? (
                <Link href={current.next.href} className="group inline-flex h-10 items-center gap-2 rounded-md bg-navy px-4 text-sm font-medium text-white hover:bg-slate-800">
                  {current.next.text}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="size-4" />Complete</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
