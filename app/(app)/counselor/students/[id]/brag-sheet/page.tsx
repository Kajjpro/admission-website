import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BragData } from "@/lib/brag-sheet";
import { BragDocument } from "@/components/brag/brag-document";
import { PrintButton } from "@/components/brag/print-button";

export const metadata = { title: "Brag sheet" };

export default async function StudentBragSheet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.rpc("brag_sheet_for_student", { student: id });
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/counselor/students/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
          <ChevronLeft className="size-4" />
          Back to student
        </Link>
        <PrintButton />
      </div>
      <BragDocument data={data as BragData} />
    </div>
  );
}
