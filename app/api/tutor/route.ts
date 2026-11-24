import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL, FALLBACK, TUTOR_DAILY_LIMIT, TUTOR_SYSTEM, aiConfigured, anthropic } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { Choice } from "@/lib/sat";

export const maxDuration = 120;

interface QuestionRow {
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  passage: string | null;
  stem: string;
  answer_type: string;
  choices: Choice[];
  correct_answer: string;
  explanation: string;
}

function questionContext(q: QuestionRow, lastResponse: { response: string; is_correct: boolean } | null) {
  const choices = q.choices.map((c) => `${c.key}) ${c.text}\n   Why: ${c.rationale ?? ""}`).join("\n");
  return [
    `Question (${q.section === "rw" ? "Reading & Writing" : "Math"} · ${q.domain} · ${q.skill} · ${q.difficulty})`,
    q.passage ? `Passage:\n${q.passage}` : null,
    `Question: ${q.stem}`,
    q.answer_type === "mcq" ? `Choices:\n${choices}` : "Student-produced response (no choices).",
    `Answer key: ${q.correct_answer}`,
    `Official explanation:\n${q.explanation}`,
    lastResponse
      ? `The student's most recent answer was "${lastResponse.response}", which is ${lastResponse.is_correct ? "correct" : "incorrect"}.`
      : "The student hasn't answered yet. Don't reveal the answer unless they ask for it.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: Request) {
  if (!aiConfigured()) return new Response("The AI tutor isn't set up yet. Ask your school admin to add an API key.", { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first.", { status: 401 });

  const { message, questionId } = (await request.json()) as { message?: string; questionId?: string | null };
  const text = message?.trim().slice(0, 4000);
  if (!text) return new Response("Empty message.", { status: 400 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("tutor_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", startOfDay.toISOString());
  if ((count ?? 0) >= TUTOR_DAILY_LIMIT) {
    return new Response(`You've used today's ${TUTOR_DAILY_LIMIT} tutor messages. They reset at midnight.`, { status: 429 });
  }

  let context: string | null = null;
  if (questionId) {
    const [{ data: q }, { data: last }] = await Promise.all([
      supabase.from("sat_questions").select("section, domain, skill, difficulty, passage, stem, answer_type, choices, correct_answer, explanation").eq("id", questionId).single(),
      supabase.from("sat_attempts").select("response, is_correct").eq("user_id", user.id).eq("question_id", questionId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!q) return new Response("Question not found.", { status: 404 });
    context = questionContext(q as QuestionRow, last);
  }

  // History comes from the database, not the client, and is capped to keep requests small.
  let historyQuery = supabase.from("tutor_messages").select("role, content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12);
  historyQuery = questionId ? historyQuery.eq("question_id", questionId) : historyQuery.is("question_id", null);
  const { data: history } = await historyQuery;

  await supabase.from("tutor_messages").insert({ user_id: user.id, question_id: questionId ?? null, role: "user", content: text });

  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  if (context) {
    // The question block is identical on every follow-up about this question, so it is cached.
    messages.push({ role: "user", content: [{ type: "text", text: context, cache_control: { type: "ephemeral" } }] });
    messages.push({ role: "assistant", content: "I have the question, answer key and explanation. What would you like to know?" });
  }
  for (const m of (history ?? []).reverse()) messages.push({ role: m.role as "user" | "assistant", content: m.content });
  messages.push({ role: "user", content: text });

  const stream = anthropic().beta.messages.stream({
    model: AI_MODEL,
    max_tokens: 8000,
    system: [{ type: "text", text: TUTOR_SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { effort: "medium" },
    messages,
    ...FALLBACK,
    betas: [...FALLBACK.betas],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      let reply = "";
      stream.on("text", (delta) => {
        reply += delta;
        controller.enqueue(encoder.encode(delta));
      });
      try {
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = "\n\nI can't help with that one. Try asking about the question itself.";
          reply += note;
          controller.enqueue(encoder.encode(note));
        }
        await supabase.from("tutor_messages").insert({
          user_id: user.id,
          question_id: questionId ?? null,
          role: "assistant",
          content: reply,
          input_tokens: final.usage.input_tokens + (final.usage.cache_read_input_tokens ?? 0),
          output_tokens: final.usage.output_tokens,
        });
      } catch (error) {
        const note =
          error instanceof Anthropic.RateLimitError
            ? "\n\nThe tutor is busy right now. Try again in a minute."
            : "\n\nSomething went wrong reaching the tutor. Try again.";
        controller.enqueue(encoder.encode(note));
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Tutor-Remaining": String(Math.max(0, TUTOR_DAILY_LIMIT - (count ?? 0) - 1)),
    },
  });
}
