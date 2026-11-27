import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BragData } from "@/lib/brag-sheet";
import { letterOutline } from "@/lib/letters";
import { LETTER_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";
import { BragDocument } from "@/components/brag/brag-document";
import type { CounselorLetter } from "@/lib/types";
import { LetterEditor } from "./letter-editor";

export const metadata = { title: "Recommendation letter" };

export default async function LetterWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireStaff();
  const supabase = await createClient();

  const { data: row } = await supabase.from("counselor_letters").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const letter = row as CounselorLetter;

  const [{ data: brag }, { data: body }] = await Promise.all([
    supabase.rpc("brag_sheet_for_student", { student: letter.student_id }),
    supabase.from("counselor_letter_bodies").select("body").eq("letter_id", id).maybeSingle(),
  ]);
  if (!brag) notFound();
  const data = brag as BragData;

  return (
    <div className="space-y-4">
      <Link href="/counselor/letters" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ChevronLeft className="size-4" />
        Letters to write
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Recommendation for {data.student.name ?? "student"}</h1>
        <Badge tone={LETTER_STATUS[letter.status].tone}>{LETTER_STATUS[letter.status].label}</Badge>
        <span className="text-sm text-slate-500">
          Asked {formatDate(letter.requested_at, { year: undefined })}
          {letter.due_date ? ` · needed by ${formatDate(letter.due_date)}` : ""}
        </span>
        <Link href={`/counselor/students/${letter.student_id}`} className="ml-auto text-sm font-medium text-accent">Full profile</Link>
      </div>

      {letter.student_message && (
        <Card className="border-indigo-200 bg-indigo-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Message from the student</p>
          <p className="mt-1 whitespace-pre-wrap text-indigo-950">{letter.student_message}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <BragDocument data={data} />
        </div>
        <LetterEditor id={id} initial={body?.body ?? ""} status={letter.status} outline={letterOutline(data, { name: me.full_name, email: me.email })} />
      </div>
    </div>
  );
}
