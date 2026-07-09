"use client";

import { useState } from "react";
import Link from "next/link";
import type { QuizDefinition } from "@/config/quizData";

export function QuizWidget({
  quiz,
  relatedTopicHref,
  relatedTopicLabel,
}: {
  quiz: QuizDefinition;
  relatedTopicHref?: string;
  relatedTopicLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const question = quiz.questions[index];
  const total = quiz.questions.length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= quiz.passScorePercent;

  const pick = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    setShowExplanation(true);
    if (optionIndex === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setShowExplanation(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setShowExplanation(false);
  };

  if (finished) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your score</p>
        <p className="mt-2 text-5xl font-bold text-foreground">{percent}%</p>
        <p className="mt-2 text-lg font-medium text-foreground">
          {score} / {total} correct
        </p>
        <p className={`mt-3 text-sm font-semibold ${passed ? "text-emerald-600" : "text-amber-600"}`}>
          {passed ? "Nice work — solid understanding!" : "Keep learning — review the topics below."}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          {relatedTopicHref && (
            <Link
              href={relatedTopicHref}
              className="rounded-xl border border-border/60 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Read {relatedTopicLabel ?? "guide"} →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border/50 bg-muted/30 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {total}
          </p>
        </div>
        <span className="text-sm font-bold text-primary">{score} pts</span>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-base font-medium text-foreground leading-relaxed">{question.question}</p>

        <ul className="space-y-2">
          {question.options.map((opt, i) => {
            let style = "border-border/60 hover:border-primary/40 hover:bg-muted/50";
            if (selected !== null) {
              if (i === question.correctIndex) style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
              else if (i === selected) style = "border-rose-400 bg-rose-50 dark:bg-rose-950/20";
              else style = "border-border/40 opacity-60";
            }

            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(i)}
                  disabled={selected !== null}
                  className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${style}`}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>

        {showExplanation && (
          <div className="rounded-xl bg-muted/50 border border-border/40 p-4 text-sm text-muted-foreground leading-relaxed">
            {question.explanation}
          </div>
        )}

        {selected !== null && (
          <button
            type="button"
            onClick={next}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {index + 1 >= total ? "See results" : "Next question →"}
          </button>
        )}
      </div>
    </div>
  );
}
