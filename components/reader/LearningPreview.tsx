interface LearningPreviewProps {
  takeaways: string[];
}

export function LearningPreview({ takeaways }: LearningPreviewProps) {
  if (takeaways.length === 0) return null;

  return (
    <section aria-label="What you'll learn" className="mb-12 not-prose">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">What you&apos;ll learn</h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {takeaways.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-foreground/85">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
