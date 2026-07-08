export interface QuickFact {
  label: string;
  value: string;
}

interface QuickFactsTableProps {
  facts: QuickFact[];
  title?: string;
}

export function QuickFactsTable({ facts, title = "Quick facts" }: QuickFactsTableProps) {
  if (facts.length === 0) return null;

  return (
    <figure className="my-8 not-prose" aria-label={title}>
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </figcaption>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40 dark:bg-muted/20">
        <table className="w-full text-sm">
          <tbody>
            {facts.map((fact, index) => (
              <tr
                key={fact.label}
                className={index !== facts.length - 1 ? "border-b border-border/50" : undefined}
              >
                <th
                  scope="row"
                  className="w-[38%] px-4 py-3 text-left font-semibold text-foreground align-top"
                >
                  {fact.label}
                </th>
                <td className="px-4 py-3 text-foreground/80 leading-relaxed">{fact.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
