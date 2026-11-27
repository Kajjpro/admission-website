import type { BragData } from "./brag-sheet";

/** A starting structure for a counsellor letter, using only facts the student gave. Bracketed parts are for the counsellor. */
export function letterOutline(data: BragData, counselor: { name: string | null; email: string | null }) {
  const s = data.student;
  const name = s.name ?? "[Student]";
  const first = name.split(" ")[0];
  const top = data.activities.slice(0, 2).map((a) => `${a.role}${a.organization ? ` at ${a.organization}` : ""}`);
  const honors = data.honors.slice(0, 2).map((h) => h.title);

  return [
    "Dear Admissions Committee,",
    "",
    `It is my pleasure to recommend ${name}${s.grade ? `, a grade ${s.grade} student` : ""}${s.school ? ` at ${s.school}` : ""}. I have known ${first} as their school counsellor since [year], and [how often / in what settings you work together].`,
    "",
    s.spike
      ? `What sets ${first} apart: ${s.spike.replace(/\.$/, "")}. [Explain this in your own words and why it matters.]`
      : `[What sets ${first} apart, in one or two sentences.]`,
    "",
    `[A specific moment that shows it. Readers remember one vivid story more than a list of adjectives.]`,
    "",
    top.length
      ? `Outside class, ${first} ${top.length === 2 ? `serves as ${top[0]} and ${top[1]}` : `serves as ${top[0]}`}. [What did ${first} change or build there? Use numbers if you can.]`
      : `[Activities: what ${first} has built or led, with numbers where possible.]`,
    honors.length ? `${first}'s honours include ${honors.join(" and ")}. [Context: how selective is it?]` : null,
    "",
    `[Character: how ${first} treats others, handles setbacks, and has grown over the last two years.]`,
    "",
    s.major ? `${first} hopes to study ${s.major}. [Why you believe ${first} will thrive in that field and on your campus.]` : `[Why you believe ${first} will thrive at university.]`,
    "",
    `I recommend ${first} [without reservation / with enthusiasm]. Please contact me${counselor.email ? ` at ${counselor.email}` : ""} with any questions.`,
    "",
    "Sincerely,",
    "",
    counselor.name ?? "[Your name]",
    `School Counsellor${s.school ? `, ${s.school}` : ""}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
