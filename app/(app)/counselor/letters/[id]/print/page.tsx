import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, splitParagraphs } from "@/lib/utils";
import { PrintButton } from "@/components/brag/print-button";

export const metadata = { title: "Print letter" };

export default async function PrintLetter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const supabase = await createClient();
  const { data: body } = await supabase.from("counselor_letter_bodies").select("body, updated_at").eq("letter_id", id).maybeSingle();
  if (!body) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/counselor/letters/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
          <ChevronLeft className="size-4" />
          Back to editing
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-lg border border-line bg-white px-10 py-12 font-serif text-[16px] leading-relaxed text-navy print:border-0 print:p-0">
        <p className="mb-8 text-right text-sm">{formatDate(new Date().toISOString())}</p>
        {splitParagraphs(body.body).map((p, i) => (
          <p key={i} className="mb-4 whitespace-pre-wrap">{p}</p>
        ))}
      </article>
    </div>
  );
}
