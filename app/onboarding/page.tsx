import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const profile = await requireProfile();
  if (profile.onboarded) redirect("/dashboard");

  const supabase = await createClient();
  const { data: counselors } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["counselor", "admin"])
    .order("full_name");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-xl font-semibold tracking-tight">Set up your profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your grade decides which roadmap tasks you see first. You can change any of this later.
      </p>
      <OnboardingForm profile={profile} counselors={counselors ?? []} />
    </div>
  );
}
