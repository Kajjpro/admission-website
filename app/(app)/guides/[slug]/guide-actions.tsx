"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Check, Library, X } from "lucide-react";
import { updateGuideProgress } from "@/app/actions/guides";
import { Citation } from "@/components/source-badge";
import { Button } from "@/components/ui";
import type { Guide } from "@/lib/types";

export function GuideActions({
  guide,
  related,
  bookmarked,
  completed,
}: {
  guide: Guide;
  related: { slug: string; title: string }[];
  bookmarked: boolean;
  completed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const [state, setState] = useOptimistic(
    { bookmarked, completed },
    (s, patch: { bookmarked?: boolean; completed?: boolean }) => ({ ...s, ...patch }),
  );

  function update(patch: { bookmarked?: boolean; completed?: boolean }) {
    start(async () => {
      setState(patch);
      await updateGuideProgress(guide.id, patch);
    });
  }

  return (
    <>
      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => update({ bookmarked: !state.bookmarked })} aria-pressed={state.bookmarked}>
          {state.bookmarked ? <BookmarkCheck className="size-4 text-accent" /> : <Bookmark className="size-4" />}
          {state.bookmarked ? "Saved" : "Save"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Library className="size-4" />
          Sources
        </Button>
        <Button variant={state.completed ? "secondary" : "primary"} size="sm" onClick={() => update({ completed: !state.completed })}>
          <Check className="size-4" />
          {state.completed ? "Read" : "Mark as read"}
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-navy/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-label="Sources and further reading"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-line bg-white"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-sm font-semibold">Sources & further reading</h2>
                <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                {guide.source_attribution.length ? (
                  guide.source_attribution.map((s) => <Citation key={s.platform + s.title} source={s} />)
                ) : (
                  <p className="text-sm text-slate-500">Written by your school's counseling team.</p>
                )}
                {related.length > 0 && (
                  <div className="border-t border-line pt-5">
                    <p className="mb-2 text-xs font-medium text-slate-500">Related guides</p>
                    <ul className="space-y-1.5">
                      {related.map((r) => (
                        <li key={r.slug}>
                          <Link href={`/guides/${r.slug}`} className="text-sm text-accent hover:underline" onClick={() => setOpen(false)}>
                            {r.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
