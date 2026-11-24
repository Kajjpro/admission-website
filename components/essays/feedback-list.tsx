"use client";

import { useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { setFeedbackResolved } from "@/app/actions/essays";
import { cn, formatDateTime } from "@/lib/utils";
import type { Feedback } from "@/lib/types";

export function FeedbackList({ items, essayId }: { items: Feedback[]; essayId: string }) {
  const [pending, start] = useTransition();
  if (!items.length) return <p className="text-sm text-slate-500">No comments yet.</p>;

  return (
    <ul className={cn("space-y-3", pending && "opacity-70")}>
      {items.map((f) => (
        <li
          key={f.id}
          className={cn("rounded-md border border-line bg-white p-3", f.is_resolved && "bg-slate-50 opacity-70")}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{f.author?.full_name ?? "Unknown"}</span>
            {f.author?.role !== "student" && <span className="text-slate-400">Counselor</span>}
            {f.paragraph_index !== null && (
              <span className="rounded bg-slate-100 px-1 font-medium text-slate-600">¶{f.paragraph_index + 1}</span>
            )}
            <span className="ml-auto text-slate-400">{formatDateTime(f.created_at)}</span>
          </div>
          {f.excerpt_quote && (
            <blockquote className="mt-2 border-l-2 border-amber-300 pl-2 font-serif text-sm italic text-slate-600">
              {f.excerpt_quote}
            </blockquote>
          )}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{f.comment}</p>
          <button
            onClick={() => start(async () => void (await setFeedbackResolved(f.id, essayId, !f.is_resolved)))}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-navy"
          >
            {f.is_resolved ? <RotateCcw className="size-3" /> : <Check className="size-3" />}
            {f.is_resolved ? "Reopen" : "Mark resolved"}
          </button>
        </li>
      ))}
    </ul>
  );
}
