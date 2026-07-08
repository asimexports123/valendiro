interface QuickRecapProps {
  points: string[];
  title?: string;
}

export function QuickRecap({ points, title = "Quick recap" }: QuickRecapProps) {
  if (points.length === 0) return null;

  return (
    <section aria-label={title} className="not-prose">
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-6 sm:p-8">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <span aria-hidden>📋</span> {title}
        </h3>
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
              <span className="text-primary font-bold shrink-0">→</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
