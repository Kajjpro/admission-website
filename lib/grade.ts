import { cookies } from "next/headers";
import type { Profile } from "./types";

export async function getGradeView(profile: Profile) {
  const store = await cookies();
  return Number(store.get("grade_view")?.value) || profile.grade_level || 9;
}
