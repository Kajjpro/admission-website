import type { Deadline, University } from "./types";
import { daysUntil } from "./utils";

export const RANK_BANDS = [
  { id: "10", label: "Top 10", max: 10 },
  { id: "50", label: "11–50", max: 50 },
  { id: "100", label: "51–100", max: 100 },
  { id: "200", label: "101–200", max: 200 },
  { id: "500", label: "201–500", max: 500 },
] as const;

export function rankBand(rank: number | null) {
  if (!rank) return "Unranked";
  return RANK_BANDS.find((b) => rank <= b.max)?.label ?? "500+";
}

/** The next dated deadline that hasn't passed, optionally limited to one round. */
export function nextDeadline(uni: Pick<University, "deadlines">, round?: string | null): Deadline | null {
  const candidates = uni.deadlines
    .filter((d) => d.date && (!round || d.round === round))
    .filter((d) => daysUntil(d.date!) >= 0)
    .sort((a, b) => a.date!.localeCompare(b.date!));
  return candidates[0] ?? null;
}
