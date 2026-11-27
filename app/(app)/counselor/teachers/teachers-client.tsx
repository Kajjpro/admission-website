"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTeacher, importTeachers } from "@/app/actions/counselor";
import { Button, Card, CardHeader, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

export function TeacherImport() {
  const [lines, setLines] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card className="h-fit">
      <CardHeader title="Add teachers" description="One per line: name, email, subject. Paste straight from a spreadsheet. Existing emails are updated." />
      <form
        className="space-y-3 p-5"
        action={(form) =>
          start(async () => {
            const res = await importTeachers(form);
            if (res && "error" in res) return setMessage({ ok: false, text: res.error! });
            setLines("");
            setMessage({ ok: true, text: `Saved ${res.added} teacher${res.added === 1 ? "" : "s"}.${res.skipped.length ? ` Skipped ${res.skipped.length} line(s) with no email.` : ""}` });
          })
        }
      >
        <Textarea
          name="lines"
          rows={8}
          value={lines}
          onChange={(e) => setLines(e.target.value)}
          placeholder={"Bat-Erdene Dorj, baterdene@school.mn, Physics\nSaruul Gan, saruul@school.mn, English"}
          className="font-mono text-xs"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending || !lines.trim()}>Save</Button>
          {message && <span className={cn("text-xs", message.ok ? "text-emerald-700" : "text-rose-600")}>{message.text}</span>}
        </div>
      </form>
    </Card>
  );
}

export function RemoveTeacher({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => confirm(`Remove ${name} from the list? Students' existing requests keep their email.`) && start(() => deleteTeacher(id))}
      className="text-slate-400 hover:text-rose-600"
      aria-label={`Remove ${name}`}
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
