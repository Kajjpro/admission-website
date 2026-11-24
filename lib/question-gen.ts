import { z } from "zod/v4";
import { generateJson } from "./gemini";
import { SAT_TAXONOMY, type Difficulty, type Section } from "./sat";

const GeneratedQuestion = z.object({
  passage: z.string().describe("Passage, notes, or table in Markdown. Empty string for math questions that need none."),
  stem: z.string(),
  answer_type: z.enum(["mcq", "spr"]),
  choices: z
    .array(z.object({ key: z.enum(["A", "B", "C", "D"]), text: z.string(), rationale: z.string() }))
    .describe("Exactly four choices A–D for mcq; empty array for spr."),
  correct_answer: z.string().describe("Letter for mcq; the simplest exact value for spr, e.g. 5, -12, 3/4"),
  accepted_answers: z.array(z.string()).describe('For spr, every equivalent form a student could enter, e.g. ["3/4", ".75", "0.75"]. Empty for mcq.'),
  explanation: z.string().describe("Step-by-step solution in Markdown; LaTeX for math. End with the trap students fall into."),
});
type Generated = z.infer<typeof GeneratedQuestion>;

const GeneratedSet = z.object({ questions: z.array(GeneratedQuestion) });

// All candidates are checked in one call to keep request counts low (free-tier limits are per request).
// That call never sees the answer keys, so each check is still an independent solve.
const VerificationSet = z.object({
  results: z.array(
    z.object({
      number: z.number().describe("Question number as given"),
      answer: z.string().describe("Letter for multiple choice, or the exact value for a student-produced response"),
      exactly_one_correct_answer: z.boolean().describe("False if ambiguous, no correct answer, or more than one"),
      problem: z.string().describe("Any error in the question, or an empty string"),
    }),
  ),
});

const RW_TOPICS = [
  "astronomy", "marine biology", "archaeology", "economics", "linguistics", "music history", "architecture",
  "neuroscience", "ecology", "chemistry", "public health", "anthropology", "geology", "sociology", "visual art",
  "engineering", "agriculture", "psychology", "political science", "a fictional short story", "a poem (original)",
  "paleontology", "urban planning", "botany", "materials science", "film studies",
];
const MATH_CONTEXTS = ["pure algebra (no context)", "finance", "physics", "biology", "sports", "travel", "manufacturing", "surveys", "geometry diagrams described in words", "science experiments"];

function pick<T>(list: T[], n: number) {
  return [...list].sort(() => Math.random() - 0.5).slice(0, n);
}

function normalize(answer: string) {
  const a = answer.trim().toUpperCase().replace(/\s+/g, "");
  const fraction = a.match(/^(-?\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) !== 0) return String(Number(fraction[1]) / Number(fraction[2]));
  return /^-?(\d+\.?\d*|\.\d+)$/.test(a) ? String(Number(a)) : a;
}

export interface QuestionInsert {
  section: Section;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  passage: string | null;
  stem: string;
  answer_type: "mcq" | "spr";
  choices: { key: string; text: string; rationale: string }[];
  correct_answer: string;
  accepted_answers: string[];
  explanation: string;
  source: "ai";
  verified: true;
}

export function sectionFor(domain: string, skill: string): Section | null {
  for (const section of Object.keys(SAT_TAXONOMY) as Section[]) {
    if (SAT_TAXONOMY[section].domains[domain]?.includes(skill)) return section;
  }
  return null;
}

export async function generateVerifiedBatch(input: {
  domain: string;
  skill: string;
  difficulty: Difficulty;
  count: number;
  examples: unknown[];
  existingStems: string[];
}): Promise<{ passed: QuestionInsert[]; rejected: number }> {
  const section = sectionFor(input.domain, input.skill);
  if (!section) throw new Error(`Unknown skill: ${input.skill}`);
  const count = Math.min(8, Math.max(1, input.count));
  const topics = section === "rw" ? pick(RW_TOPICS, count) : pick(MATH_CONTEXTS, Math.min(count, 4));

  const generated = await generateJson(
    GeneratedSet,
    `Write ${count} new, original Digital SAT practice questions.

Section: ${SAT_TAXONOMY[section].label}
Domain: ${input.domain}
Skill: ${input.skill}
Difficulty: ${input.difficulty}
Vary the subject matter across: ${topics.join(", ")}.

Requirements:
- Match the real Digital SAT format for this skill: passage length (25–150 words for Reading & Writing, one question per passage), question wording, and four answer choices. For math, about one in four questions may be student-produced response (spr).
- Difficulty must genuinely match "${input.difficulty}": easy = one step, common vocabulary; medium = two steps or a plausible distractor; hard = multi-step reasoning, subtle distractors, denser text.
- Every question must have exactly one defensible correct answer. Wrong choices should reflect real student mistakes, and each rationale must say precisely why that choice is right or wrong.
- Solve each question fully before finalizing it, and check all arithmetic.
- Original content only: do not copy or paraphrase College Board or other published questions or copyrighted passages.
- Don't repeat these existing questions in this skill: ${input.existingStems.map((s) => s.slice(0, 70)).join(" | ") || "none"}

Style reference from our bank (do not copy):
${JSON.stringify(input.examples, null, 1).slice(0, 5000)}`,
  );

  const candidates = (generated?.questions ?? []).filter(
    (q) => (q.answer_type === "mcq" ? q.choices.length === 4 && /^[A-D]$/.test(q.correct_answer.trim()) : q.correct_answer.trim()),
  );
  if (!candidates.length) return { passed: [], rejected: generated?.questions.length ?? 0 };

  const shown = candidates
    .map((q: Generated, i) =>
      [
        `### Question ${i + 1}`,
        q.passage && `Passage:\n${q.passage}`,
        `Question: ${q.stem}`,
        q.answer_type === "mcq" ? q.choices.map((c) => `${c.key}) ${c.text}`).join("\n") : "Student-produced response: give the exact value.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    )
    .join("\n\n");

  const verification = await generateJson(
    VerificationSet,
    `Solve each SAT question below independently and carefully, as an expert test-taker. For each, give your answer and judge whether it has exactly one correct answer. Return one result per question, numbered as given.\n\n${shown}`,
  );
  const byNumber = new Map((verification?.results ?? []).map((r) => [r.number, r]));

  const passed: QuestionInsert[] = [];
  candidates.forEach((q, i) => {
    const v = byNumber.get(i + 1);
    const keys = [q.correct_answer, ...q.accepted_answers].map(normalize);
    if (!v || !v.exactly_one_correct_answer || v.problem.trim() || !keys.includes(normalize(v.answer))) return;
    passed.push({
      section,
      domain: input.domain,
      skill: input.skill,
      difficulty: input.difficulty,
      passage: q.passage.trim() || null,
      stem: q.stem,
      answer_type: q.answer_type,
      choices: q.answer_type === "mcq" ? q.choices : [],
      correct_answer: q.correct_answer.trim(),
      accepted_answers: q.answer_type === "spr" ? [...new Set([q.correct_answer.trim(), ...q.accepted_answers.map((a) => a.trim())])] : [],
      explanation: q.explanation,
      source: "ai",
      verified: true,
    });
  });

  return { passed, rejected: (generated?.questions.length ?? 0) - passed.length };
}
