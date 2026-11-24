import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui";
import type { AdmissionResult } from "@/lib/types";

export function AdmissionResults({ results }: { results: AdmissionResult[] }) {
  if (!results.length) return null;
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <GraduationCap className="size-4 text-accent" />
        <h2 className="text-sm font-semibold">Where our students got in</h2>
        <span className="text-xs text-slate-500">{results.length} admits</span>
      </div>
      <div className="flex gap-3 overflow-x-auto p-4">
        {results.map((r) => (
          <div key={r.id} className="w-52 shrink-0 rounded-md border border-line bg-canvas p-3">
            <p className="truncate text-sm font-semibold">{r.university_name}</p>
            <p className="truncate text-xs text-slate-600">{r.student_name}{r.class_year ? ` · Class of ${r.class_year}` : ""}</p>
            {r.scholarship && <p className="mt-1.5 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">{r.scholarship}</p>}
            {r.note && <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{r.note}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
