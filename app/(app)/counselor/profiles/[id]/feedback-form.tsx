"use client";

import { useState, useTransition } from "react";
import { respondToProfileReview } from "@/app/actions/application";
import { Button, Card, CardHeader, Label, Textarea } from "@/components/ui";
import { REVIEW_SECTIONS, type ReviewSectionKey } from "@/lib/application";
import { cn } from "@/lib/utils";

export function ProfileFeedbackForm({
  id,
  overall: initialOverall,
  sections: initialSections,
  reviewed,
}: {
  id: string;
  overall: string;
  sections: Partial<Record<ReviewSectionKey, string>>;
  reviewed: boolean;
}) {
  const [overall, setOverall] = useState(initialOverall);
  const [sections, setSections] = useState<Record<string, string>>(initialSections as Record<string, string>);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save(markReviewed: boolean) {
    start(async () => {
      const res = await respondToProfileReview(id, { overall, sections, markReviewed });
      setMessage(res?.error ? { ok: false, text: res.error } : { ok: true, text: markReviewed ? "Sent to the student." : "Draft saved." });
    });
  }

  return (
    <Card>
      <CardHeader title="Your feedback" description={reviewed ? "Already sent. Edits update what the student sees." : "Comments appear under each section for the student."} />
      <div className="max-h-[calc(100vh-14rem)] space-y-4 overflow-y-auto p-5">
        <div>
          <Label htmlFor="overall">Overall</Label>
          <Textarea id="overall" rows={4} value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="Big picture: what's strongest, what to do next, and by when." />
        </div>
        {REVIEW_SECTIONS.map((s) => (
          <div key={s.key}>
            <Label htmlFor={`fb-${s.key}`}>{s.label}</Label>
            <Textarea id={`fb-${s.key}`} rows={2} value={sections[s.key] ?? ""} onChange={(e) => setSections({ ...sections, [s.key]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line p-4">
        <Button onClick={() => save(true)} disabled={pending}>{reviewed ? "Update feedback" : "Send feedback"}</Button>
        <Button variant="ghost" onClick={() => save(false)} disabled={pending}>Save draft</Button>
        {message && <span className={cn("text-xs", message.ok ? "text-emerald-700" : "text-rose-600")}>{message.text}</span>}
      </div>
    </Card>
  );
}
