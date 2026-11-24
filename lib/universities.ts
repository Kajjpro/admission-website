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

export type Fit = { label: "Likely" | "Target" | "Reach"; tone: "emerald" | "indigo" | "rose"; detail: string };

/** Where a student's best SAT sits against a college's middle 50%, adjusted for very selective schools. */
export function satFit(score: number | null, uni: Pick<University, "sat_25" | "sat_75" | "acceptance_rate">): Fit | null {
  if (!score || !uni.sat_25 || !uni.sat_75) return null;
  const verySelective = uni.acceptance_rate !== null && uni.acceptance_rate < 0.2;
  const note = verySelective ? " Under 20% are admitted, so treat it as a reach for everyone." : "";
  if (score >= uni.sat_75) {
    return verySelective
      ? { label: "Reach", tone: "rose", detail: `Your ${score} is at or above their top quarter.${note}` }
      : { label: "Likely", tone: "emerald", detail: `Your ${score} is at or above their top quarter (${uni.sat_75}).` };
  }
  if (score >= uni.sat_25) {
    return verySelective
      ? { label: "Reach", tone: "rose", detail: `Your ${score} is inside their middle 50%.${note}` }
      : { label: "Target", tone: "indigo", detail: `Your ${score} is inside their middle 50% (${uni.sat_25}–${uni.sat_75}).` };
  }
  return { label: "Reach", tone: "rose", detail: `${uni.sat_25 - score} points below their middle 50% (${uni.sat_25}–${uni.sat_75}).` };
}

export const percent = (v: number | null, digits = 0) => (v === null ? "—" : `${(v * 100).toFixed(digits)}%`);
export const usd = (v: number | null) => (v === null ? "—" : `$${v.toLocaleString("en-US")}`);
