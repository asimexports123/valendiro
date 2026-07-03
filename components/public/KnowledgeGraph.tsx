/**
 * Knowledge Graph Visualization
 *
 * Displays a lightweight learning map showing:
 * Prerequisites → Current Topic → Next Topics → Advanced Topics
 */

import Link from "next/link";

interface KnowledgeNode {
  id: string;
  slug: string;
  title: string;
  relationship: string;
}

interface KnowledgeGraphProps {
  prerequisites: KnowledgeNode[];
  currentTopic: { title: string };
  nextTopics: KnowledgeNode[];
  applications: KnowledgeNode[];
  lang: string;
}

export function KnowledgeGraph({
  prerequisites,
  currentTopic,
  nextTopics,
  applications,
  lang,
}: KnowledgeGraphProps) {
  // Always show the component, even if no knowledge graph data exists
  const hasData = prerequisites.length > 0 || nextTopics.length > 0 || applications.length > 0;

  return (
    <div className="mt-14 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="text-xl">🗺️</span>
        <h3 className="text-base font-semibold text-foreground">Learning Path</h3>
      </div>

      {!hasData && (
        <div className="text-sm text-muted-foreground">
          Learning path data will be available soon. Explore related topics below.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Start with</div>
            <div className="flex flex-wrap gap-2">
              {prerequisites.map((node) => (
                <Link
                  key={node.id}
                  href={`/${lang}/topics/${node.slug}`}
                  className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  {node.title}
                </Link>
              ))}
            </div>
            <div className="mt-2 text-center text-muted-foreground text-xs">↓</div>
          </div>
        )}

        {/* Current Topic */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
          <div className="text-xs text-primary/70 mb-1 font-medium">You are here</div>
          <div className="text-base font-semibold text-primary">{currentTopic.title}</div>
        </div>

        {/* Next Topics */}
        {nextTopics.length > 0 && (
          <div>
            <div className="mt-2 text-center text-muted-foreground text-xs">↓</div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">Continue with</div>
            <div className="flex flex-wrap gap-2">
              {nextTopics.map((node) => (
                <Link
                  key={node.id}
                  href={`/${lang}/topics/${node.slug}`}
                  className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  {node.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Applications/Advanced */}
        {applications.length > 0 && (
          <div>
            {nextTopics.length > 0 && (
              <div className="mt-2 text-center text-muted-foreground text-xs">↓</div>
            )}
            <div className="text-xs text-muted-foreground mb-2 font-medium">Apply to</div>
            <div className="flex flex-wrap gap-2">
              {applications.map((node) => (
                <Link
                  key={node.id}
                  href={`/${lang}/topics/${node.slug}`}
                  className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  {node.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
