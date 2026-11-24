import { requireProfile } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { TutorChat, type TutorMessage } from "@/components/practice/tutor-chat";

export const metadata = { title: "AI tutor" };

export default async function TutorPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutor_messages")
    .select("role, content")
    .eq("user_id", profile.id)
    .is("question_id", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI tutor" description="Paste any SAT question, ask about a concept, or ask for a study plan. Questions from the practice bank have their own tutor on each question." />
      <Card className="p-5">
        {aiConfigured() ? (
          <TutorChat
            questionId={null}
            initial={((data ?? []) as TutorMessage[]).reverse()}
            className="min-h-[50vh]"
            placeholder="Paste a question or ask about any SAT topic"
            suggestions={[
              "How do I approach Words in Context questions?",
              "Explain how to complete the square",
              "Make me a 4-week plan to go from 1250 to 1400",
              "What are the most common grammar rules on the SAT?",
            ]}
          />
        ) : (
          <p className="text-sm text-slate-500">The AI tutor isn't set up yet. An admin needs to add a Gemini API key.</p>
        )}
      </Card>
    </div>
  );
}
