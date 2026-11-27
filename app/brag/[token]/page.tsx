import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BragData } from "@/lib/brag-sheet";
import { BragDocument } from "@/components/brag/brag-document";
import { PrintButton } from "@/components/brag/print-button";
import { MarkSubmitted } from "./mark-submitted";

export const metadata: Metadata = { title: "Brag sheet", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TeacherBragSheet({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("brag_sheet_for_teacher", { token });
  if (!data) notFound();
  const sheet = data as BragData;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:py-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-slate-500">
          Shared privately with you by {sheet.student.name ?? "a student"} for their recommendation letter.
        </p>
        <PrintButton />
      </div>
      <BragDocument data={sheet} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-5 print:hidden">
        <p className="text-sm text-slate-600">Let {sheet.student.name?.split(" ")[0] ?? "the student"} know when the letter is in.</p>
        <MarkSubmitted token={token} submitted={sheet.recommender?.status === "submitted"} />
      </div>
    </main>
  );
}
