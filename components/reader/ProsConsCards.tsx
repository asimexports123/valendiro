import type { ProsCons } from "@/lib/reader/contentParser";

interface ProsConsCardsProps {
  data: ProsCons;
}

export function ProsConsCards({ data }: ProsConsCardsProps) {
  if (data.pros.length === 0 && data.cons.length === 0) return null;

  return (
    <figure className="my-10 not-prose" aria-label="Pros and cons comparison">
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Pros vs Cons
      </figcaption>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.pros.length > 0 && (
          <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
              <span aria-hidden>✓</span> Advantages
            </h4>
            <ul className="space-y-2">
              {data.pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                  <span className="text-emerald-600 shrink-0 mt-0.5">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.cons.length > 0 && (
          <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-5">
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
              <span aria-hidden>✗</span> Limitations
            </h4>
            <ul className="space-y-2">
              {data.cons.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80 leading-relaxed">
                  <span className="text-amber-600 shrink-0 mt-0.5">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </figure>
  );
}
