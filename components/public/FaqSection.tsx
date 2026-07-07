"use client";

import { useState } from "react";
import { PublicQuestion } from "@/services/public/publicData";

export function FaqSection({ questions }: { questions: PublicQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <section>
      <div className="space-y-3">
        {questions.map((q, index) => (
          <details
            key={q.id}
            className="group rounded-xl overflow-hidden border border-cyan-200/50 dark:border-cyan-800/30 bg-gradient-to-br from-cyan-50/30 via-cyan-50/10 to-transparent dark:from-cyan-950/20 dark:via-cyan-950/10 dark:to-transparent hover:border-cyan-400/50 dark:hover:border-cyan-600/50 hover:shadow-md transition-all"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 text-foreground font-semibold list-none select-none hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <span className="flex-shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-500 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="leading-relaxed text-sm">{q.question_text}</span>
              </div>
              <span className="shrink-0 mt-0.5 h-6 w-6 flex items-center justify-center rounded-lg border border-cyan-200/50 dark:border-cyan-800/30 text-cyan-500 transition-transform duration-200 group-open:rotate-180 group-open:border-cyan-400/50 dark:group-open:border-cyan-600/50 group-open:bg-cyan-500/10 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="px-5 pb-5 pt-1 text-muted-foreground leading-relaxed text-sm pl-14">
              {q.answer || "Answer coming soon."}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
