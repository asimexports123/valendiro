import Link from "next/link";
import { getToolsForSubcategory, toolPath } from "@/config/toolsRegistry";

export function SubcategoryToolsSection({
  lang,
  subcategorySlug,
}: {
  lang: string;
  subcategorySlug: string;
}) {
  const tools = getToolsForSubcategory(subcategorySlug);
  if (tools.length === 0) return null;

  return (
    <section className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 sm:p-8">
      <h2 className="text-lg font-bold text-foreground mb-1">Interactive tools</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Put concepts into practice — calculators and quizzes for this subcategory.
      </p>
      <ul className="space-y-3">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link
              href={toolPath(lang, tool.slug)}
              className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <span className="text-2xl" aria-hidden>
                {tool.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{tool.shortDescription}</p>
              </div>
              <span className="text-xs font-semibold text-primary shrink-0">Try it →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
