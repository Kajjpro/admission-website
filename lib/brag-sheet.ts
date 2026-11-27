export const BRAG_QUESTIONS = [
  { id: "adjectives", q: "Three words that describe you, and why", hint: "Pick words a teacher could back up with an example." },
  { id: "meaningful_class", q: "Your most meaningful class so far", hint: "What made it stick? What did you do beyond the requirements?" },
  { id: "class_moment", q: "A specific classroom moment you're proud of", hint: "A question you asked, a presentation, a lab that went wrong and how you fixed it." },
  { id: "project", q: "A project that shows how you think", hint: "Explain your process, not just the result." },
  { id: "challenge", q: "A challenge you faced and how you responded", hint: "Academic or personal. Focus on what you did." },
  { id: "growth", q: "Where you've grown most in the last two years", hint: "Recommenders love to describe a growth arc." },
  { id: "outside", q: "What you do outside class that teachers may not know", hint: "Jobs, family responsibilities, hobbies, community roles." },
  { id: "goals", q: "What you hope to study and why", hint: "Even if you're unsure, describe the questions you're drawn to." },
  { id: "mention", q: "Anything you'd like your recommender to mention", hint: "Context they should know, e.g. a hard semester." },
] as const;

/** Shape returned by the brag_sheet_for_teacher / brag_sheet_for_student database functions. */
export interface BragData {
  student: {
    name: string | null;
    email: string | null;
    grade: number | null;
    school: string | null;
    major: string | null;
    spike: string | null;
    gpa: string | null;
    class_rank: string | null;
    rigor: string | null;
    regions: string[] | null;
  };
  answers: Record<string, string>;
  activities: { role: string; organization: string; description: string; hours: number; weeks: number; grades: number[] }[];
  honors: { title: string; level: string; grade: number | null }[];
  tests: { type: string; best: number }[];
  universities: { name: string; country: string; round: string | null }[];
  recommender?: { name: string; subject: string | null; context: string | null; notes: string | null; due_date: string | null; status: string };
}

export function bragShareUrl(origin: string, token: string) {
  return `${origin}/brag/${token}`;
}

/** Plain-text email the student sends from their own mail app. */
export function bragEmail(opts: { teacher: string; student: string; subject: string | null; due: string | null; link: string }) {
  const first = opts.teacher.split(" ").slice(-1)[0];
  const body = [
    `Dear ${first},`,
    "",
    `Would you be willing to write a recommendation letter for my university applications${opts.subject ? `, based on ${opts.subject}` : ""}?`,
    opts.due ? `The letter is due on ${opts.due}.` : null,
    "",
    "I've put together a brag sheet with my activities, honours, university list and a few moments from class that may help:",
    opts.link,
    "",
    "When you've submitted the letter, you can tick \"Letter submitted\" on that page so I know.",
    "",
    "Thank you very much for considering this.",
    "",
    opts.student,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return { subject: `Recommendation letter request – ${opts.student}`, body };
}
