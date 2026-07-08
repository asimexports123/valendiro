import type { ParsedArticleContent } from "@/lib/reader/contentParser";
import { splitAfterWhatItIsSection } from "@/lib/reader/contentParser";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { LearningPreview } from "./LearningPreview";
import { TopicDiagram } from "./TopicDiagram";
import { QuickFactsTable } from "./QuickFactsTable";

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

/**
 * Reader body — markdown first. One optional topic-specific diagram when it teaches.
 * Quick Facts table sits directly below the "What it is" section when enabled.
 */
export function ArticleReaderBody({ slug, content, parsed }: ArticleReaderBodyProps) {
  const showQuickFacts = slug === "mutual-fund-fundamentals";
  const { beforeQuickFacts, afterQuickFacts, hasWhatItIs } = splitAfterWhatItIsSection(content);
  const useSplit = showQuickFacts && hasWhatItIs;

  return (
    <article className="article-reader">
      {parsed.keyTakeaways.length >= 2 && (
        <LearningPreview takeaways={parsed.keyTakeaways} />
      )}

      <TopicDiagram slug={slug} content={content} />

      {useSplit ? (
        <>
          <MarkdownContent content={beforeQuickFacts} />
          <QuickFactsTable facts={MUTUAL_FUND_QUICK_FACTS} />
          {afterQuickFacts.trim() ? <MarkdownContent content={afterQuickFacts} /> : null}
        </>
      ) : (
        <MarkdownContent content={content} />
      )}
    </article>
  );
}
