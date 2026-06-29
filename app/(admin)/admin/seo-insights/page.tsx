import { getSeoInsights } from "@/services/admin/dashboardData";

export default async function SeoInsightsPage() {
  const { keywordGaps, linkSuggestions, error } = await getSeoInsights(15);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">SEO Insights</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Keyword Gaps ({keywordGaps.length})
          </h2>
          <ul className="divide-y divide-border/60">
            {keywordGaps.map((gap) => (
              <li key={gap.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <span className="text-foreground/80">{gap.keyword}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {gap.opportunity_score}/100
                </span>
              </li>
            ))}
            {keywordGaps.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No keyword gaps detected</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Internal Link Suggestions ({linkSuggestions.length})
          </h2>
          <ul className="divide-y divide-border/60">
            {linkSuggestions.map((link) => (
              <li key={link.id} className="px-5 py-3 text-sm">
                <span className="text-foreground/80">
                  {link.source_object_type} → {link.target_object_type}
                </span>
                {link.anchor_text && <p className="text-xs text-muted-foreground mt-1">Anchor: {link.anchor_text}</p>}
              </li>
            ))}
            {linkSuggestions.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No link suggestions</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
