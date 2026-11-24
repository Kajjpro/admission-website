export type Section = "rw" | "math";
export type Difficulty = "easy" | "medium" | "hard";

/** Digital SAT content domains and skills, as published by College Board. */
export const SAT_TAXONOMY: Record<Section, { label: string; domains: Record<string, string[]> }> = {
  rw: {
    label: "Reading & Writing",
    domains: {
      "Information and Ideas": ["Central Ideas and Details", "Command of Evidence", "Inferences"],
      "Craft and Structure": ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"],
      "Expression of Ideas": ["Rhetorical Synthesis", "Transitions"],
      "Standard English Conventions": ["Boundaries", "Form, Structure, and Sense"],
    },
  },
  math: {
    label: "Math",
    domains: {
      Algebra: [
        "Linear equations in one variable",
        "Linear functions",
        "Linear equations in two variables",
        "Systems of two linear equations in two variables",
        "Linear inequalities in one or two variables",
      ],
      "Advanced Math": [
        "Nonlinear functions",
        "Nonlinear equations in one variable and systems of equations in two variables",
        "Equivalent expressions",
      ],
      "Problem-Solving and Data Analysis": [
        "Ratios, rates, proportional relationships, and units",
        "Percentages",
        "One-variable data: distributions and measures of center and spread",
        "Two-variable data: models and scatterplots",
        "Probability and conditional probability",
        "Inference from sample statistics and margin of error",
        "Evaluating statistical claims: observational studies and experiments",
      ],
      "Geometry and Trigonometry": [
        "Area and volume",
        "Lines, angles, and triangles",
        "Right triangles and trigonometry",
        "Circles",
      ],
    },
  },
};

export function sectionOfDomain(domain: string): Section | null {
  if (domain in SAT_TAXONOMY.rw.domains) return "rw";
  if (domain in SAT_TAXONOMY.math.domains) return "math";
  return null;
}

export interface Choice {
  key: string;
  text: string;
  rationale?: string;
}

/** What the client sees before answering: no key, no rationales. */
export interface PublicQuestion {
  id: string;
  section: Section;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  passage: string | null;
  stem: string;
  answer_type: "mcq" | "spr";
  choices: Choice[];
}

export interface GradedResult {
  isCorrect: boolean;
  correctAnswer: string;
  choices: Choice[];
  explanation: string;
}

export const PUBLIC_QUESTION_COLUMNS = "id, section, domain, skill, difficulty, passage, stem, answer_type, choices";

export function toPublicQuestion(row: PublicQuestion): PublicQuestion {
  return { ...row, choices: row.choices.map(({ key, text }) => ({ key, text })) };
}
