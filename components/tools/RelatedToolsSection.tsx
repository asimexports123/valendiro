import Link from "next/link";
import { getToolsForTopic, toolPath, type CatalogTool } from "@/config/toolsRegistry";

export function RelatedToolsSection({
  lang,
  topicSlug,
  subcategorySlug,
}: {
  lang: string;
  topicSlug: string;
  subcategorySlug?: string | null;
}) {
  const tools = getToolsForTopic(topicSlug, subcategorySlug);
  if (tools.length === 0) return null;

  return (
    <section
      className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-6 sm:p-7 not-prose"
      aria-labelledby="related-tools-heading"
    >
      <h2 id="related-tools-heading" className="text-base font-bold text-foreground">
        Try it yourself
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Interactive {tools.length === 1 ? "tool" : "tools"} related to this guide.
      </p>
      <ul className="mt-4 space-y-2">
        {tools.map((tool) => (
          <RelatedToolLink key={tool.id} lang={lang} tool={tool} />
        ))}
      </ul>
    </section>
  );
}

function RelatedToolLink({ lang, tool }: { lang: string; tool: CatalogTool }) {
  return (
    <li>
      <Link
        href={toolPath(lang, tool.slug)}
        className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all"
      >
        <span className="text-xl shrink-0" aria-hidden>
          {tool.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {tool.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.shortDescription}</p>
        </div>
        <span className="text-xs font-semibold text-primary shrink-0">
          {tool.kind === "quiz" ? "Quiz →" : "Open →"}
        </span>
      </Link>
    </li>
  );
}
