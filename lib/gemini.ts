import { ApiError, GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";
import { toJSONSchema, type z } from "zod/v4";

/** gemini-3.8-flash: Google's stable, most capable Flash model, available on the free tier. */
export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let client: GoogleGenAI | null = null;
export function gemini() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function isRateLimit(error: unknown) {
  return error instanceof ApiError && error.status === 429;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function toContents(turns: ChatTurn[]): Content[] {
  return turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] }));
}

function jsonSchemaFor(schema: z.ZodType) {
  const { $schema: _ignored, ...rest } = toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** One JSON-only call validated against a zod schema. Returns null if the output doesn't match. Rate-limit errors are rethrown. */
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
