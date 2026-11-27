import type {
  ApplicationStatus,
  EssayType,
  GuideCategory,
  ImpactCategory,
  RecommenderStatus,
  ReviewStatus,
  TaskCategory,
} from "./types";

export const GRADES = [9, 10, 11, 12] as const;

export const REGIONS = [
  "North America",
  "UK & Ireland",
  "Europe",
  "East Asia",
  "Southeast Asia",
  "Oceania",
] as const;

export const REVIEW_STATUS: Record<ReviewStatus, { label: string; tone: Tone }> = {
  draft: { label: "Drafting", tone: "neutral" },
  submitted: { label: "Submitted for review", tone: "indigo" },
  reviewed: { label: "Feedback given", tone: "amber" },
  meeting_scheduled: { label: "Ready for in-person meeting", tone: "sky" },
  completed: { label: "Revised", tone: "emerald" },
};

export const ESSAY_TYPES: Record<EssayType, { label: string; defaultLimit: number }> = {
  personal_statement: { label: "Personal statement", defaultLimit: 650 },
  study_plan: { label: "Study plan / motivation letter", defaultLimit: 1000 },
  supplemental: { label: "Supplemental", defaultLimit: 250 },
};

export const FOCUS_AREAS = ["Structure", "Hook", "Clarity", "Voice", "Reflection", "Study plan alignment", "Grammar"];

export const TASK_CATEGORIES: Record<TaskCategory, string> = {
  essay: "Essays",
  testing: "Testing",
  ec: "Activities",
  rec: "Recommendations",
  general: "Academics & planning",
};

export const GUIDE_CATEGORIES: Record<GuideCategory, string> = {
  ps: "Personal statement",
  study_plan: "Study plan",
  supplemental: "Supplemental essays",
  sat: "SAT",
  ielts: "IELTS",
  ec: "Activities",
  rec: "Recommendations",
};

export const IMPACT_CATEGORIES: Record<ImpactCategory, string> = {
  leadership: "Leadership",
  service: "Community service",
  research: "Research / projects",
  arts_athletics: "Arts / athletics",
  work_family: "Work / family",
};

export const RECOMMENDER_STATUS: Record<RecommenderStatus, { label: string; tone: Tone }> = {
  not_asked: { label: "Not asked", tone: "neutral" },
  requested: { label: "Requested", tone: "indigo" },
  in_progress: { label: "In progress", tone: "amber" },
  submitted: { label: "Submitted", tone: "emerald" },
};

export const LETTER_STATUS: Record<import("./types").LetterStatus, { label: string; student: string; tone: Tone }> = {
  requested: { label: "New request", student: "Sent to your counsellor", tone: "indigo" },
  writing: { label: "Writing", student: "Your counsellor is writing it", tone: "amber" },
  done: { label: "Finished", student: "Written", tone: "emerald" },
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  researching: { label: "Researching", tone: "neutral" },
  applying: { label: "Applying", tone: "amber" },
  submitted: { label: "Submitted", tone: "indigo" },
  admitted: { label: "Admitted", tone: "emerald" },
  waitlisted: { label: "Waitlisted", tone: "sky" },
  rejected: { label: "Not admitted", tone: "rose" },
};

export type Tone = "neutral" | "indigo" | "emerald" | "amber" | "rose" | "sky";

export const KNOWN_SOURCES = ["College Essay Guy", "Hack the College Essay", "stoic.education"] as const;
