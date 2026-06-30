import Link from "next/link";
import { PublicCategory } from "@/services/public/publicData";

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  technology:        { emoji: "💻", color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40" },
  business:          { emoji: "🚀", color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/40" },
  "personal-finance":{ emoji: "💰", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  education:         { emoji: "📚", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  "health-wellness": { emoji: "🏃", color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/40" },
  "home-lifestyle":  { emoji: "🏠", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  travel:            { emoji: "✈️", color: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-950/40" },
};

function CountPill({ n, label }: { n: number; label: string }) {
  if (n === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
      <span className="font-semibold text-foreground/70">{n}</span> {label}{n !== 1 ? "s" : ""}
    </span>
  );
}

export function CategoryGrid({ lang, categories }: { lang: string; categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Explore by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            In-depth guides, tutorials and answers across {categories.length} knowledge areas.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const meta = CATEGORY_META[category.slug];
            const emoji = meta?.emoji ?? "📖";
            const color = meta?.color ?? "text-primary";
            const bg   = meta?.bg   ?? "bg-muted";
            const desc = category.description || `Explore ${category.name} resources.`;
            const hasAny = category.collection_count > 0 || category.topic_count > 0 || category.article_count > 0;
            return (
              <Link
                key={category.id}
                href={`/${lang}/categories/${category.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${bg}`}>
                  {emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold ${color} group-hover:opacity-80 transition-opacity`}>
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                  {hasAny && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                      <CountPill n={category.collection_count} label="collection" />
                      {category.collection_count > 0 && category.topic_count > 0 && (
                        <span className="text-border">·</span>
                      )}
                      <CountPill n={category.topic_count} label="topic" />
                      {category.topic_count > 0 && category.article_count > 0 && (
                        <span className="text-border">·</span>
                      )}
                      <CountPill n={category.article_count} label="article" />
                    </div>
                  )}
                  {!hasAny && (
                    <p className="mt-2 text-[11px] text-muted-foreground/60 italic">Coming soon</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
