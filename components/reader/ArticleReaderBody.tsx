import type { ParsedArticleContent } from "@/lib/reader/contentParser";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { StepFlowDiagram } from "./StepFlowDiagram";
import { ProsConsCards } from "./ProsConsCards";
import { RelationshipDiagram } from "./RelationshipDiagram";
import { LearningPreview } from "./LearningPreview";

interface ArticleReaderBodyProps {
  content: string;
  parsed: ParsedArticleContent;
  topicTitle: string;
  entities: { slug: string; name: string }[];
}

/**
 * Reader body: markdown + auto-generated educational illustrations from content structure.
 * Skips any diagram when insufficient structured data exists.
 */
export function ArticleReaderBody({ content, parsed, topicTitle, entities }: ArticleReaderBodyProps) {
  const showProcess = parsed.processSteps && parsed.processSteps.steps.length >= 2;
  const showProsCons = parsed.prosCons && (parsed.prosCons.pros.length > 0 || parsed.prosCons.cons.length > 0);
  const showRelations = entities.length >= 2;

  return (
    <article className="article-reader">
      {parsed.keyTakeaways.length > 0 && <LearningPreview takeaways={parsed.keyTakeaways} />}

      {/* Concept map before deep content when entities available */}
      {showRelations && (
        <RelationshipDiagram topicTitle={topicTitle} entities={entities} />
      )}

      <MarkdownContent content={content} />

      {/* Post-content visual learning aids derived from markdown structure */}
      {showProcess && parsed.processSteps && (
        <StepFlowDiagram data={parsed.processSteps} />
      )}
      {showProsCons && parsed.prosCons && (
        <ProsConsCards data={parsed.prosCons} />
      )}
    </article>
  );
}
