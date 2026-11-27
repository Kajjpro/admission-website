"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/profile";
import { Button, Input, Label, Select } from "@/components/ui";
import { GRADES, REGIONS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function OnboardingForm({
  profile,
  counselors,
}: {
  profile: Profile;
  counselors: { id: string; full_name: string | null; email?: string | null }[];
}) {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const isStudent = profile.role === "student";

  return (
    <form action={action} className="mt-8 space-y-6">
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} required />
      </div>

      {isStudent && (
        <>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-slate-600">Current grade</legend>
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <label key={g} className="cursor-pointer">
                  <input type="radio" name="grade_level" value={g} required className="peer sr-only" defaultChecked={profile.grade_level === g} />
                  <span className="block rounded-md border border-line bg-white py-2 text-center text-sm peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent">
                    Grade {g}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-slate-600">Where are you thinking of applying?</legend>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <label key={r} className="cursor-pointer">
                  <input type="checkbox" name="target_regions" value={r} className="peer sr-only" defaultChecked={profile.target_regions.includes(r)} />
                  <span className="block rounded-full border border-line bg-white px-3 py-1 text-sm peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent">
                    {r}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <Label htmlFor="assigned_counselor_id">School counselor</Label>
            <Select id="assigned_counselor_id" name="assigned_counselor_id" defaultValue={profile.assigned_counselor_id ?? ""}>
              <option value="">I'll choose later</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? c.email ?? "Counsellor"}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-slate-500">Your counselor can see your roadmap, scores and activities to help you plan.</p>
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Continue"}</Button>
    </form>
  );
}
