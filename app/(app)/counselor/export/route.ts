import { getProfile } from "@/lib/auth";
import { FLAG_LABELS, getStudentSummaries } from "@/lib/counselor";
import { createClient } from "@/lib/supabase/server";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything and neutralise leading formula characters for spreadsheet safety.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET() {
  const profile = await getProfile();
  if (!profile || profile.role === "student") return new Response("Forbidden", { status: 403 });
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, grade_level, school_name, intended_major, spike_statement, target_regions")
    .eq("role", "student")
    .order("full_name");
  if (profile.role !== "admin") query = query.eq("assigned_counselor_id", profile.id);
  const { data } = await query;
  const rows = await getStudentSummaries(supabase, data ?? []);

  const header = ["Name", "Grade", "School", "Intended major", "Spike", "Best SAT", "Best IELTS", "Activities", "Letters submitted", "Letters", "Essays shared", "Universities", "Next deadline", "Next deadline date", "Open tasks", "Overdue tasks", "Practice questions (7d)", "Flags"];
  const lines = rows.map((s) =>
    [s.name, s.grade, s.school, s.major, s.spike, s.bestSat, s.bestIelts, s.activities, s.lettersSubmitted, s.letters, s.essaysShared, s.listCount, s.next ? `${s.next.university} (${s.next.round})` : "", s.next?.date, s.openTasks, s.overdueTasks, s.practicedThisWeek, s.flags.map((f) => FLAG_LABELS[f]).join("; ")]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
