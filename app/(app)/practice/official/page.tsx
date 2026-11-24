import { requireProfile } from "@/lib/auth";
import { OfficialEmbed } from "./official-embed";

export const metadata = { title: "Official questions" };

export default async function OfficialPracticePage() {
  await requireProfile();
  return <OfficialEmbed />;
}
