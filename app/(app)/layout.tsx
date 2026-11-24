import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getGradeView } from "@/lib/grade";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (!profile.onboarded) redirect("/onboarding");

  const store = await cookies();
  const gradeView = await getGradeView(profile);

  return (
    <AppShell profile={profile} gradeView={gradeView} initialCollapsed={store.get("sidebar")?.value === "collapsed"}>
      {children}
    </AppShell>
  );
}
