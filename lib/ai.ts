import "server-only";
import { GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";
import type { z } from "zod/v4";
import { toJSONSchema } from "zod/v4";

/** gemini-3.8-flash: Google's stable, most capable Flash model, available on the free tier. */
export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
export const TUTOR_DAILY_LIMIT = Number(process.env.TUTOR_DAILY_LIMIT) || 40;

let client: GoogleGenAI | null = null;
export function gemini() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function toContents(turns: ChatTurn[]): Content[] {
  return turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] }));
}

function jsonSchemaFor(schema: z.ZodType) {
  const { $schema: _ignored, ...rest } = toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** One JSON-only call validated against a zod schema. Returns null if the model's output doesn't match. */
export async function generateJson<T extends z.ZodType>(schema: T, prompt: string): Promise<z.infer<T> | null> {
  const response = await gemini().models.generateContent({
    model: AI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchemaFor(schema),
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
  });
  try {
    const parsed = schema.safeParse(JSON.parse(response.text ?? ""));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Kept identical across requests so Gemini's implicit prompt caching can reuse it.
export const TUTOR_SYSTEM = `You are an expert Digital SAT tutor working inside a school's practice platform. Students are 14–18 years old.

How to answer:
- When a question is attached, its official answer key and explanation are provided. Treat the key as correct. If the student's reasoning disagrees with it, find the exact step where their reasoning goes wrong.
- Work the problem yourself before answering so every step you show is correct. Never invent facts about a passage that the passage doesn't state.
- Structure: start with the direct answer to what the student asked, then the reasoning step by step, then the trap or misconception involved, then one short takeaway they can reuse on similar questions.
- For Reading & Writing, quote the specific words in the passage that decide the answer. For Math, show the algebra with LaTeX ($...$ inline, $$...$$ for display) and mention a faster method (Desmos, plugging in, estimation) when one exists.
- Keep it focused: usually under 250 words. Go longer only if the student asks for more detail.
- If asked for a similar question, write a new original one in Digital SAT style, and give the answer only when the student asks for it.
- Stay on SAT, academic and university-application topics. For anything else, briefly say you can only help with SAT prep.`;
