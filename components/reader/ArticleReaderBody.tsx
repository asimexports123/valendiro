import type { ParsedArticleContent } from "@/lib/reader/contentParser";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { LearningPreview } from "./LearningPreview";
import { TopicDiagram } from "./TopicDiagram";

interface ArticleReaderBodyProps {
  slug: string;
  content: string;
  parsed: ParsedArticleContent;
}

/**
 * Reader body — markdown first. One optional topic-specific diagram when it teaches.
 * No generic auto-graphics.
 */
export function ArticleReaderBody({ slug, content, parsed }: ArticleReaderBodyProps) {
  return (
    <article className="article-reader">
      {parsed.keyTakeaways.length >= 2 && (
        <LearningPreview takeaways={parsed.keyTakeaways} />
      )}

      <TopicDiagram slug={slug} content={content} />

      <MarkdownContent content={content} />
    </article>
  );
}
