export interface QuickFact {
  label: string;
  value: string;
}

interface QuickFactsTableProps {
  category: string | null;
  title?: string;
}

const FINANCE_QUICK_FACTS: QuickFact[] = [
  { label: "Category", value: "Finance" },
  { label: "Asset Type", value: "Pooled investment fund" },
  { label: "Risk Level", value: "Medium" },
  { label: "Liquidity", value: "High (daily NAV redemption)" },
  { label: "Typical Hold Period", value: "Long-term (3+ years)" },
  { label: "Regulation", value: "SEBI (India) / SEC (US)" },
];

const SOFTWARE_ENGINEERING_QUICK_FACTS: QuickFact[] = [
  { label: "Category", value: "Software Engineering" },
  { label: "Complexity", value: "Intermediate" },
  { label: "Primary Language", value: "Varies by stack" },
  { label: "Learning Curve", value: "Moderate" },
  { label: "Typical Use Case", value: "Building scalable applications" },
  { label: "Prerequisites", value: "Basic programming fundamentals" },
];

function getQuickFactsForCategory(category: string | null): QuickFact[] {
  if (!category) return [];

  if (category === "finance" || category === "personal-finance") {
    return FINANCE_QUICK_FACTS;
  }

  if (category === "software_engineering" || category === "technology") {
    return SOFTWARE_ENGINEERING_QUICK_FACTS;
  }

  return [];
}

export function hasQuickFactsForCategory(category: string | null): boolean {
  return getQuickFactsForCategory(category).length > 0;
}

export function QuickFactsTable({ category, title = "Quick facts" }: QuickFactsTableProps) {
  const facts = getQuickFactsForCategory(category);
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
