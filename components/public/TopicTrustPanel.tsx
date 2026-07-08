import Link from "next/link";

export interface TopicCitation {
  id: string;
  sourceName: string;
  sourceUrl: string | null;
  adapterName: string | null;
  sourceAuthority: string | null;
}

export interface TopicTrustMeta {
  lastReviewed: string | null;
  confidenceScore: number | null;
  completenessScore: number | null;
  citationCount: number;
  factCount: number;
  coverageLabel: string;
  confidenceLabel: string;
}

interface TopicTrustPanelProps {
  citations: TopicCitation[];
  trust: TopicTrustMeta;
  lang: string;
  /** Omit outer heading when embedded in article footer */
  compact?: boolean;
}

function resolveCitationHref(citation: TopicCitation): string | null {
  const url = citation.sourceUrl?.trim();
  if (url) return url;

  const name = citation.sourceName?.trim();
  if (name && /^https?:\/\//i.test(name)) return name;

  return null;
}

function citationDisplayLabel(citation: TopicCitation, href: string | null): string {
  const name = citation.sourceName?.trim() || "Source";
  if (!href) return name;

  if (name === href || /^https?:\/\//i.test(name)) {
    try {
      const parsed = new URL(href);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.hostname.replace(/^www\./, "")}${path}`;
    } catch {
      return name;
    }
  }

  return name;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function TopicTrustPanel({ citations, trust, lang, compact }: TopicTrustPanelProps) {
  const hasSources = citations.length > 0;

  return (
    <section
      aria-label="Sources and editorial trust"
      className={compact ? "" : "mb-20 rounded-xl border border-border/50 bg-muted/20 p-6 sm:p-8"}
    >
      {!compact && (
        <h2 className="text-2xl font-bold text-foreground mb-6 tracking-tight">Sources &amp; trust</h2>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Last reviewed</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {trust.lastReviewed ? formatDate(trust.lastReviewed) : "Not yet verified"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Knowledge confidence</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{trust.confidenceLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Coverage</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{trust.coverageLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Facts cited</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {trust.factCount > 0
              ? `${trust.citationCount} source${trust.citationCount !== 1 ? "s" : ""} · ${trust.factCount} facts`
              : "Limited source data"}
          </dd>
        </div>
      </dl>

      {hasSources ? (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Referenced sources</h3>
          <ul className="space-y-2">
            {citations.map((cit) => {
              const href = resolveCitationHref(cit);
              const label = citationDisplayLabel(cit, href);

              return (
                <li key={cit.id} className="text-sm">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium break-words"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{label}</span>
                  )}
                  {cit.sourceAuthority && cit.sourceAuthority !== "community" && (
                    <span className="ml-2 text-xs text-muted-foreground capitalize">
                      ({cit.sourceAuthority})
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Source citations are being expanded for this topic. Check back after the next editorial review.
        </p>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        <Link href={`/${lang}/about`} className="hover:text-foreground underline underline-offset-2">
          How Valendiro sources knowledge
        </Link>
      </p>
    </section>
  );
}
