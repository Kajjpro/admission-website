import { requireProfile } from "@/lib/auth";
import { getPracticeStats } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";
import { OfficialEmbed } from "./official-embed";

export const metadata = { title: "Official questions" };

export default async function OfficialPracticePage() {
  const profile = await requireProfile();
  const stats = await getPracticeStats(await createClient(), profile.id);
  return <OfficialEmbed officialToday={stats.officialToday} today={stats.today} goal={profile.daily_goal} />;
}
