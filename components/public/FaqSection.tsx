"use client";

import { useState } from "react";
import { PublicQuestion } from "@/services/public/publicData";

export function FaqSection({ questions }: { questions: PublicQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <section>
      <div className="space-y-2">
        {questions.map((q, index) => (
          <details
            key={q.id}
            className="group rounded-lg overflow-hidden border border-border/40 hover:border-foreground/20 transition-all"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 text-foreground font-medium list-none select-none hover:bg-foreground/[0.02] transition-colors">
              <span className="leading-relaxed text-base">{q.question_text}</span>
              <span className="shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center rounded border border-border/40 text-foreground/40 transition-transform duration-200 group-open:rotate-180 group-open:border-foreground/20 text-xs">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="px-5 pb-4 pt-0 text-foreground/60 leading-relaxed text-base">
              {q.answer || "Answer coming soon."}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
