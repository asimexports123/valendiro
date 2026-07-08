import type { ParsedArticleContent } from "@/lib/reader/contentParser";
import {
  splitAfterWhatItIsSection,
  splitWhyItMattersSection,
} from "@/lib/reader/contentParser";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { LearningPreview } from "./LearningPreview";
import { TopicDiagram } from "./TopicDiagram";
import { QuickFactsTable } from "./QuickFactsTable";
import { KeyInsightCallout } from "./KeyInsightCallout";

interface ArticleReaderBodyProps {
  slug: string;
  content: string;
  parsed: ParsedArticleContent;
}

/** Hardcoded preview facts — mutual-fund-fundamentals only for now. */
const MUTUAL_FUND_QUICK_FACTS = [
  { label: "Category", value: "Finance" },
  { label: "Asset Type", value: "Pooled investment fund" },
  { label: "Risk Level", value: "Medium" },
  { label: "Liquidity", value: "High (daily NAV redemption)" },
  { label: "Typical Hold Period", value: "Long-term (3+ years)" },
  { label: "Regulation", value: "SEBI (India) / SEC (US)" },
];

function renderWithQuickFacts(content: string, slug: string) {
  const showQuickFacts = slug === "mutual-fund-fundamentals";
  const { beforeQuickFacts, afterQuickFacts, hasWhatItIs } = splitAfterWhatItIsSection(content);
  const useSplit = showQuickFacts && hasWhatItIs;

  if (!useSplit) {
    return content.trim() ? <MarkdownContent content={content} /> : null;
  }

  return (
    <>
      <MarkdownContent content={beforeQuickFacts} />
      <QuickFactsTable facts={MUTUAL_FUND_QUICK_FACTS} />
      {afterQuickFacts.trim() ? <MarkdownContent content={afterQuickFacts} /> : null}
    </>
  );
}

function renderArticleContent(content: string, slug: string) {
  const whySplit = splitWhyItMattersSection(content);

  if (!whySplit.hasWhyItMatters) {
    return renderWithQuickFacts(content, slug);
  }

  return (
    <>
      {renderWithQuickFacts(whySplit.before, slug)}
      <MarkdownContent content={whySplit.heading} />
      {whySplit.body ? (
        <KeyInsightCallout>
          <MarkdownContent content={whySplit.body} />
        </KeyInsightCallout>
      ) : null}
      {whySplit.after.trim() ? <MarkdownContent content={whySplit.after} /> : null}
    </>
  );
}

/**
 * Reader body — markdown first. One optional topic-specific diagram when it teaches.
 * Quick Facts table sits directly below the "What it is" section when enabled.
 * "Why it matters" section body renders inside a Key Insight callout.
 */
export function ArticleReaderBody({ slug, content, parsed }: ArticleReaderBodyProps) {
  return (
    <article className="article-reader">
      {parsed.keyTakeaways.length >= 2 && (
        <LearningPreview takeaways={parsed.keyTakeaways} />
      )}

      <TopicDiagram slug={slug} content={content} />

      {renderArticleContent(content, slug)}
    </article>
  );
}
