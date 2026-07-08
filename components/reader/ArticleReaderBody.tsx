import type { ParsedArticleContent } from "@/lib/reader/contentParser";
import {
  splitAfterWhatItIsSection,
  splitWhyItMattersSection,
} from "@/lib/reader/contentParser";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { LearningPreview } from "./LearningPreview";
import { TopicDiagram } from "./TopicDiagram";
import { QuickFactsTable, hasQuickFactsForCategory } from "./QuickFactsTable";
import { KeyInsightCallout } from "./KeyInsightCallout";

interface ArticleReaderBodyProps {
  slug: string;
  content: string;
  parsed: ParsedArticleContent;
  category: string | null;
}

function renderWithQuickFacts(content: string, category: string | null) {
  const { beforeQuickFacts, afterQuickFacts, hasWhatItIs } = splitAfterWhatItIsSection(content);
  const useSplit = hasWhatItIs && hasQuickFactsForCategory(category);

  if (!useSplit) {
    return content.trim() ? <MarkdownContent content={content} /> : null;
  }

  return (
    <>
      <MarkdownContent content={beforeQuickFacts} />
      <QuickFactsTable category={category} />
      {afterQuickFacts.trim() ? <MarkdownContent content={afterQuickFacts} /> : null}
    </>
  );
}

function renderArticleContent(content: string, category: string | null) {
  const whySplit = splitWhyItMattersSection(content);

  if (!whySplit.hasWhyItMatters) {
    return renderWithQuickFacts(content, category);
  }

  return (
    <>
      {renderWithQuickFacts(whySplit.before, category)}
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
export function ArticleReaderBody({ slug, content, parsed, category }: ArticleReaderBodyProps) {
  return (
    <article className="article-reader">
      {parsed.keyTakeaways.length >= 2 && (
        <LearningPreview takeaways={parsed.keyTakeaways} />
      )}

      <TopicDiagram slug={slug} content={content} />

      {renderArticleContent(content, category)}
    </article>
  );
}
