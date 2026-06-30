import { PublicQuestion } from "@/services/public/publicData";

export function FaqSection({ questions }: { questions: PublicQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">❓</span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="space-y-3">
        {questions.map((q) => (
          <details
            key={q.id}
            className="group rounded-2xl border border-border/60 bg-card overflow-hidden transition-all open:border-primary/25 open:shadow-sm"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-6 py-4 text-foreground font-medium list-none select-none hover:bg-muted/40 transition-colors">
              <span className="leading-relaxed">{q.question_text}</span>
              <span className="shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:border-primary/30 group-open:text-primary text-xs">
                ▾
              </span>
            </summary>
            <div className="px-6 pb-5 pt-1 text-muted-foreground leading-relaxed text-[0.9375rem]">
              {q.answer || "Answer coming soon."}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
