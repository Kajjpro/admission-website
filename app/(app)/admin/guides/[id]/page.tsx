import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import type { Guide } from "@/lib/types";
import { GuideEditor } from "./guide-editor";

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  let guide: Guide | null = null;
  if (id !== "new") {
    const supabase = await createClient();
    const { data } = await supabase.from("guides").select("*").eq("id", id).single();
    if (!data) notFound();
    guide = data as Guide;
  }

  return (
    <>
      <PageHeader title={guide ? `Edit: ${guide.title}` : "New guide"} />
      <GuideEditor guide={guide} />
    </>
  );
}
