import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import type { Activity } from "@/lib/types";
import { ActivityList } from "./activity-list";

export const metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("activities").select("*").eq("user_id", profile.id).order("position_order");

  return (
    <>
      <PageHeader
        title="Activities"
        description="The Common App allows 10 activities with a 150-character description each. Order them by importance to you."
      />
      <ActivityList activities={(data ?? []) as Activity[]} />
    </>
  );
}
