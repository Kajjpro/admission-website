import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  // getClaims verifies the session token locally (no round trip to Supabase Auth) when the
  // project uses asymmetric signing keys, and falls back to a server check otherwise.
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data as Profile | null;
});

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireStaff() {
  const profile = await requireProfile();
  if (profile.role === "student") redirect("/dashboard");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

/** For server actions: returns the client and the signed-in user id, or throws. */
export async function authedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Not signed in");
  return { supabase, userId };
}
