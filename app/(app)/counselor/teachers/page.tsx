import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import type { Teacher } from "@/lib/types";
import { TeacherImport, RemoveTeacher } from "./teachers-client";

export const metadata = { title: "Teachers" };

export default async function TeachersPage() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: teachers }, { data: recs }] = await Promise.all([
    supabase.from("teachers").select("id, full_name, email, subject").order("full_name"),
    // Counsellors see their own students' requests through RLS; admins see all.
    supabase.from("recommenders").select("teacher_id, status").not("teacher_id", "is", null),
  ]);
  const load = (id: string) => {
    const mine = (recs ?? []).filter((r) => r.teacher_id === id);
    return { total: mine.length, done: mine.filter((r) => r.status === "submitted").length };
  };

  return (
    <>
      <PageHeader
        title="Teachers"
        description="The school's teacher list. Students pick their recommenders from it, so the email on each request is always right."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-x-auto">
          <CardHeader title={`${teachers?.length ?? 0} teachers`} />
          {teachers?.length ? (
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  {["Name", "Email", "Subject", "Letters (submitted / asked)", ""].map((h) => (
                    <th key={h} className="px-4 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(teachers as Teacher[]).map((t) => {
                  const l = load(t.id);
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5 font-medium">{t.full_name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{t.email}</td>
                      <td className="px-4 py-2.5 text-slate-600">{t.subject ?? "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums">{l.total ? `${l.done} / ${l.total}` : "—"}</td>
                      <td className="px-4 py-2.5 text-right"><RemoveTeacher id={t.id} name={t.full_name} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No teachers yet. Paste the list on the right.</p>
          )}
        </Card>
        <TeacherImport />
      </div>
    </>
  );
}
