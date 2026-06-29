import { PublicQuestion } from "@/services/public/publicData";

export function FaqSection({ questions }: { questions: PublicQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <section className="mt-16 max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {questions.map((q) => (
          <details
            key={q.id}
            className="group rounded-2xl border border-border bg-card p-5 open:border-primary/20"
          >
            <summary className="flex cursor-pointer items-center justify-between text-foreground font-medium list-none">
              {q.question_text}
              <span className="ml-4 text-muted-foreground transition group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-3 text-muted-foreground leading-relaxed">{q.answer || "No answer published yet."}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
