"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Send, Trash2 } from "lucide-react";
import { addHonor, deleteHonor, saveApplicationProfile, sendProfileForReview } from "@/app/actions/application";
import { Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { HONOR_LEVELS } from "@/lib/application";
import { GRADES, REGIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProfileInitial {
  full_name: string;
  grade_level: number | null;
  school_name: string;
  intended_major: string;
  gpa: string;
  class_rank: string;
  rigor_notes: string;
  spike_statement: string;
  target_regions: string[];
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [spike, setSpike] = useState(initial.spike_statement);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      action={(form) =>
        start(async () => {
          const res = await saveApplicationProfile(form);
          setMessage("error" in res && res.error ? { ok: false, text: res.error } : { ok: true, text: "Saved" });
        })
      }
      className="space-y-6"
    >
      <Card>
        <CardHeader title="About you" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={initial.full_name} />
          </div>
          <div>
            <Label htmlFor="grade_level">Grade</Label>
            <Select id="grade_level" name="grade_level" defaultValue={initial.grade_level ?? ""}>
              <option value="">—</option>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="school_name">School</Label>
            <Input id="school_name" name="school_name" defaultValue={initial.school_name} placeholder="e.g. School No. 1, Ulaanbaatar" />
          </div>
          <div>
            <Label htmlFor="intended_major">Intended major</Label>
            <Input id="intended_major" name="intended_major" defaultValue={initial.intended_major} placeholder="e.g. Computer science" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-xs font-medium text-slate-600">Where you're applying</legend>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <label key={r} className="cursor-pointer">
                  <input type="checkbox" name="target_regions" value={r} defaultChecked={initial.target_regions.includes(r)} className="peer sr-only" />
                  <span className="block rounded-full border border-line bg-white px-3 py-1 text-sm peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent">{r}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card>
        <CardHeader title="Academics" description="Readers judge grades against the courses your school offers." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="gpa">Grades</Label>
            <Input id="gpa" name="gpa" defaultValue={initial.gpa} placeholder="e.g. 96% average, or 4.8 / 5" />
          </div>
          <div>
            <Label htmlFor="class_rank">Class rank (if your school ranks)</Label>
            <Input id="class_rank" name="class_rank" defaultValue={initial.class_rank} placeholder="e.g. 2 of 120" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="rigor_notes">Hardest courses you've taken</Label>
            <Textarea id="rigor_notes" name="rigor_notes" rows={3} defaultValue={initial.rigor_notes} placeholder="e.g. Advanced math track, physics olympiad class, AP Calculus BC (self-study)" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Your spike, in one line"
          description="Finish the sentence a reader would use to remember you."
          action={<Link href="/guides/spike-why-colleges-want-one" className="text-xs font-medium text-accent">What's a spike?</Link>}
        />
        <div className="p-5">
          <div className="flex items-start gap-2 rounded-md border border-line bg-white px-3 py-2 focus-within:border-accent">
            <span className="pt-1 font-serif text-lg text-slate-400">I am the student who</span>
            <textarea
              name="spike_statement"
              value={spike}
              onChange={(e) => setSpike(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="builds tools so children can read the script their grandparents wrote."
              className="flex-1 resize-none bg-transparent pt-1 font-serif text-lg outline-none placeholder:text-slate-300"
            />
          </div>
          <p className="mt-1.5 text-right text-xs tabular-nums text-slate-400">{spike.length}/200</p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
        {message && <span className={cn("text-sm", message.ok ? "text-emerald-700" : "text-rose-600")}>{message.text}</span>}
      </div>
    </form>
  );
}

export function HonorsEditor({ honors }: { honors: { id: string; title: string; level: string; grade: number | null; description: string | null }[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardHeader title={`Honours (${honors.length} of 5)`} description="Competition results, selections and awards. Training and participation belong in Activities." />
      {honors.length > 0 && (
        <ul className="divide-y divide-line">
          {honors.map((h) => (
            <li key={h.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{h.title}</p>
                <p className="text-xs text-slate-500">{HONOR_LEVELS[h.level]}{h.grade ? ` · Grade ${h.grade}` : ""}{h.description ? ` · ${h.description}` : ""}</p>
              </div>
              <button onClick={() => start(async () => deleteHonor(h.id))} className="text-slate-400 hover:text-rose-600" aria-label={`Remove ${h.title}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {honors.length < 5 && (
        <form
          ref={ref}
          className="grid gap-3 border-t border-line p-5 sm:grid-cols-[1fr_150px_100px]"
          action={(form) =>
            start(async () => {
              const res = await addHonor(form);
              setError(res?.error ?? null);
              if (!res?.error) ref.current?.reset();
            })
          }
        >
          <Input name="title" placeholder="e.g. National Math Olympiad, bronze" maxLength={100} required aria-label="Honour" />
          <Select name="level" defaultValue="school" aria-label="Level">
            {Object.entries(HONOR_LEVELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select name="grade" defaultValue="" aria-label="Grade">
            <option value="">Grade</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Input name="description" placeholder="Optional: how many competed, how few placed" className="sm:col-span-2" aria-label="Details" />
          <Button type="submit" variant="secondary" disabled={pending}>Add</Button>
          {error && <p className="text-xs text-rose-600 sm:col-span-3">{error}</p>}
        </form>
      )}
    </Card>
  );
}

export function SendForReview({
  counselors,
  defaultCounselorId,
  pending: hasPending,
  completeness,
}: {
  counselors: { id: string; full_name: string | null }[];
  defaultCounselorId: string | null;
  pending: boolean;
  completeness: number;
}) {
  const [counselorId, setCounselorId] = useState(defaultCounselorId ?? counselors[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card className="overflow-hidden">
      <div className="bg-navy px-5 py-4 text-white">
        <p className="font-semibold">Send to your counsellor</p>
        <p className="mt-0.5 text-xs text-slate-300">They'll see a snapshot of everything above and can comment on each section.</p>
      </div>
      <form
        className="space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await sendProfileForReview({ counselorId, note });
            setMessage(res?.error ? { ok: false, text: res.error } : { ok: true, text: "Sent. You'll see their feedback here." });
            if (!res?.error) setNote("");
          });
        }}
      >
        <Select value={counselorId} onChange={(e) => setCounselorId(e.target.value)} aria-label="Counsellor">
          <option value="">Choose a counsellor</option>
          {counselors.map((c) => <option key={c.id} value={c.id}>{c.full_name ?? "Unnamed"}</option>)}
        </Select>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should they look at? e.g. Is my spike clear? Which activities should I cut?" />
        {completeness < 0.5 && <p className="text-xs text-amber-700">Your profile is less than half complete. Counsellors can help more once more is filled in.</p>}
        {hasPending && <p className="text-xs text-slate-500">You already have a review waiting. Sending again creates a new snapshot.</p>}
        <Button type="submit" className="w-full" disabled={pending || !counselorId}>
          <Send className="size-4" />
          {pending ? "Sending…" : "Send for review"}
        </Button>
        {message && <p className={cn("text-sm", message.ok ? "text-emerald-700" : "text-rose-600")}>{message.text}</p>}
      </form>
    </Card>
  );
}
