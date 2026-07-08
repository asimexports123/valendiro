import type { ReactNode } from "react";

interface KeyInsightCalloutProps {
  children: ReactNode;
}

/** Green left-border callout for the "Why it matters" section body. */
export function KeyInsightCallout({ children }: KeyInsightCalloutProps) {
  return (
    <aside
      role="note"
      aria-label="Key Insight"
      className="my-6 not-prose rounded-r-lg px-5 py-5 sm:px-6 sm:py-6 [&_.article-prose_p:first-child]:mt-0 [&_.article-prose_p:last-child]:mb-0 [&_.article-prose_ul:last-child]:mb-0 [&_.article-prose_ol:last-child]:mb-0"
      style={{ backgroundColor: "#f0fdf4", borderLeft: "4px solid #22c55e" }}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-[#15803d] mb-3">
        Key Insight
      </div>
      <div className="text-[0.9375rem] leading-relaxed text-foreground/85">{children}</div>
    </aside>
  );
}
