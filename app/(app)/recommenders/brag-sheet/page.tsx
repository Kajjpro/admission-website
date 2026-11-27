import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BragData } from "@/lib/brag-sheet";
import { BragDocument } from "@/components/brag/brag-document";
import { PrintButton } from "@/components/brag/print-button";

export const metadata = { title: "Brag sheet" };

export default async function BragSheetPreview() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.rpc("brag_sheet_for_student", { student: profile.id });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/recommenders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
          <ChevronLeft className="size-4" />
          Recommendations
        </Link>
        <PrintButton />
      </div>
      <p className="text-sm text-slate-500 print:hidden">
        This is what each teacher sees from their link. Their own notes and due date appear at the top of their copy.
      </p>
      {data ? <BragDocument data={data as BragData} /> : <p className="text-sm text-slate-500">Couldn't load your brag sheet.</p>}
    </div>
  );
}
