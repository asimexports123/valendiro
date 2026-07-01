"use client";

import { MermaidDiagram } from "./MermaidDiagram";

interface ArticleBodyProps {
  content: string;
  className?: string;
}

/**
 * Renders article markdown content with support for Mermaid diagrams.
 * Splits content at ```mermaid blocks and renders them as interactive diagrams.
 */
export function ArticleBody({ content, className = "" }: ArticleBodyProps) {
  const parts = splitMermaidBlocks(content);

  return (
    <div className={`article-body ${className}`}>
      {parts.map((part, i) => {
        if (part.type === "mermaid") {
          return <MermaidDiagram key={i} chart={part.content} />;
        }
        return (
          <div
            key={i}
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:scroll-mt-20 prose-headings:font-semibold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-muted-foreground
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-table:border prose-table:border-border prose-th:bg-muted/50 prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
              prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        );
      })}
    </div>
  );
}

interface ContentPart {
  type: "html" | "mermaid";
  content: string;
}

function splitMermaidBlocks(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add content before the mermaid block
    if (match.index > lastIndex) {
      parts.push({ type: "html", content: content.slice(lastIndex, match.index) });
    }
    // Add the mermaid block
    parts.push({ type: "mermaid", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining content
  if (lastIndex < content.length) {
    parts.push({ type: "html", content: content.slice(lastIndex) });
  }

  return parts;
}
