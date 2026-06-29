import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getRecentQuestions } from "@/services/public/publicData";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Questions",
    description: "Find answers to structured questions across every topic.",
    canonical: `/${lang}/questions`,
  });
}

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const questions = await getRecentQuestions(30);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Questions</h1>
        <p className="mt-2 text-lg text-muted-foreground">Structured answers across every topic.</p>
      </div>
      <div className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="rounded-2xl border border-border bg-background p-6 hover:shadow-[var(--shadow)] transition-shadow duration-200"
          >
            <h3 className="text-lg font-medium text-foreground">{question.question_text}</h3>
            {question.answer ? (
              <p className="mt-3 text-muted-foreground leading-relaxed">{question.answer}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground italic">No answer published yet.</p>
            )}
          </div>
        ))}
      </div>
      {questions.length === 0 && (
        <p className="text-muted-foreground">No questions indexed yet.</p>
      )}
    </div>
  );
}
