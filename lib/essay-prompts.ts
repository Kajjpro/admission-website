import type { EssayType, GuideCategory } from "./types";

export const ESSAY_HELP: Record<EssayType, { breakdown: string[]; brainstorm: string[]; guideCategories: GuideCategory[] }> = {
  personal_statement: {
    breakdown: [
      "The reader wants to know who you are beyond grades and activities.",
      "Pick one thread (a value, object, place or question) and stay with it.",
      "Spend more words on reflection than on describing events.",
    ],
    brainstorm: [
      "What do you do when nobody asks you to?",
      "Which of your top five values shows up in your daily routine?",
      "What object would a friend say is most \"you\"? Why?",
      "When did you change your mind about something important?",
      "What problem do you keep thinking about after class?",
    ],
    guideCategories: ["ps"],
  },
  study_plan: {
    breakdown: [
      "Academic background: what prepared you for this field?",
      "Direction: the major, sub-field and questions you want to pursue.",
      "Fit: specific courses, labs or faculty at this university.",
      "After graduation: how this degree connects to your plans and your home country.",
    ],
    brainstorm: [
      "Which course or project made you choose this field?",
      "Name two professors or labs whose work you would want to join.",
      "What skill does your country or community need that this degree builds?",
      "Where do you see yourself five years after graduating?",
    ],
    guideCategories: ["study_plan"],
  },
  supplemental: {
    breakdown: [
      "Answer the exact question asked; supplements are short.",
      "Every sentence should be specific to this university or this prompt.",
      "Don't repeat your personal statement.",
    ],
    brainstorm: [
      "Which three courses or programs here can you name without looking?",
      "Which student organization would you join in your first month?",
      "What did you learn on a call, visit or info session that surprised you?",
    ],
    guideCategories: ["supplemental", "ps"],
  },
};
