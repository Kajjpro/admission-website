import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LETTER_STATUS } from "@/lib/constants";
import { daysUntil, formatDate } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { LetterStatus } from "@/lib/types";

export const metadata = { title: "Letters to write" };

type Row = { id: string; status: LetterStatus; due_date: string | null; requested_at: string; completed_at: string | null; student_message: string | null; student: { full_name: string | null; grade_level: number | null } | null };

export default async function LettersPage() {
  const me = await requireStaff();
  const supabase = await createClient();
  let query = supabase
    .from("counselor_letters")
    .select("id, status, due_date, requested_at, completed_at, student_message, student:profiles!counselor_letters_student_id_fkey(full_name, grade_level)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("requested_at");
  if (me.role !== "admin") query = query.eq("counselor_id", me.id);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.status !== "done");
  const done = rows.filter((r) => r.status === "done");

  return (
    <>
      <PageHeader title="Letters to write" description="Students who asked you for a recommendation. Each opens with their brag sheet beside the letter." />
      {rows.length ? (
        <div className="space-y-6">
          <LetterList title={`To write (${open.length})`} rows={open} empty="Nothing waiting. Nice." />
          {done.length > 0 && <LetterList title={`Finished (${done.length})`} rows={done} />}
        </div>
      ) : (
        <EmptyState title="No requests yet">Students ask from their Recommendations page. Requests show up here and on your dashboard.</EmptyState>
      )}
    </>
  );
}

function LetterList({ title, rows, empty }: { title: string; rows: Row[]; empty?: string }) {
  return (
    <Card>
      <div className="border-b border-line px-5 py-3 text-sm font-semibold">{title}</div>
      {rows.length ? (
        <ul className="divide-y divide-line">
          {rows.map((r) => {
            const days = r.due_date ? daysUntil(r.due_date) : null;
            return (
              <li key={r.id}>
                <Link href={`/counselor/letters/${r.id}`} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.student?.full_name ?? "Student"}{r.student?.grade_level ? <span className="font-normal text-slate-500"> · Grade {r.student.grade_level}</span> : null}</p>
                    <p className="truncate text-xs text-slate-500">{r.student_message ?? `Asked ${formatDate(r.requested_at, { year: undefined })}`}</p>
                  </div>
                  {r.status !== "done" && days !== null && (
                    <span className={`text-xs tabular-nums ${days <= 7 ? "font-medium text-rose-600" : "text-slate-500"}`}>
                      {days < 0 ? "Past due" : `Due in ${days}d`}
                    </span>
                  )}
                  {r.status === "done" && r.completed_at && <span className="text-xs text-slate-500">Finished {formatDate(r.completed_at, { year: undefined })}</span>}
                  <Badge tone={LETTER_STATUS[r.status].tone}>{LETTER_STATUS[r.status].label}</Badge>
                  <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>
      )}
    </Card>
  );
}
