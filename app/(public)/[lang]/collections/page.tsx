import { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts, getCollectionsByCategory, CollectionDifficulty } from "@/services/public/publicData";
import { EmptyState } from "@/components/public/EmptyState";

export const revalidate = 3600;

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  technology:          { emoji: "💻", color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-950/40" },
  "personal-finance":  { emoji: "💰", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  business:            { emoji: "�", color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40" },
  education:           { emoji: "📚", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  "health-wellness":   { emoji: "�", color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-950/40" },
  "home-lifestyle":    { emoji: "🏠", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  travel:              { emoji: "✈️", color: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-50 dark:bg-sky-950/40" },
};

const COLLECTION_ICONS: Record<string, string> = {
  technology: "🔬", "personal-finance": "📊", business: "📋",
  education: "📖", "health-wellness": "💊", "home-lifestyle": "🛠️", travel: "🗺️",
};

const DIFFICULTY_CONFIG: Record<CollectionDifficulty, { label: string; color: string }> = {
  Beginner:     { label: "Beginner",     color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
  Intermediate: { label: "Intermediate", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400" },
  Advanced:     { label: "Advanced",     color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Collections — Valendiro",
    description: "Browse structured learning collections across 7 knowledge areas. Each collection is a focused learning path with topics and articles ordered from beginner to advanced.",
    canonical: `/${lang}/collections`,
  });
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const categories = await getCategoriesWithCounts(10);

  const collectionsPerCategory = await Promise.all(
    categories.map(async (cat) => ({
      category: cat,
      collections: await getCollectionsByCategory(cat.id, 12),
    }))
  );
  const grouped = collectionsPerCategory.filter((g) => g.collections.length > 0);
  const totalCollections = grouped.reduce((sum, g) => sum + g.collections.length, 0);
  const totalTopics = grouped.reduce((sum, g) => sum + g.collections.reduce((s, c) => s + c.topic_count, 0), 0);

  return (
    <>
      {/* Page Header */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <Link href={`/${lang}`} className="hover:text-foreground transition-colors">Home</Link>
            <span>›</span>
            <span className="text-foreground font-medium">Collections</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Knowledge Collections
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Structured learning paths organised by subject. Each collection groups related topics into a clear progression — from foundational concepts to advanced mastery.
          </p>

          {/* Stats row */}
          {totalCollections > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <div>
                <span className="text-2xl font-bold text-foreground">{totalCollections}</span>
                <span className="ml-1.5 text-sm text-muted-foreground">Collections</span>
              </div>
              <div className="w-px h-5 bg-border/60 hidden sm:block" />
              {totalTopics > 0 && (
                <div>
                  <span className="text-2xl font-bold text-foreground">{totalTopics}</span>
                  <span className="ml-1.5 text-sm text-muted-foreground">Topics</span>
                </div>
              )}
              <div className="w-px h-5 bg-border/60 hidden sm:block" />
              <div>
                <span className="text-2xl font-bold text-foreground">{grouped.length}</span>
                <span className="ml-1.5 text-sm text-muted-foreground">Knowledge Areas</span>
              </div>
            </div>
          )}

          {/* Hierarchy hint */}
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border/50 rounded-full px-3 py-1.5">
            <span>Category</span>
            <span className="text-border">›</span>
            <span className="font-semibold text-foreground">Collection</span>
            <span className="text-border">›</span>
            <span>Topic</span>
            <span className="text-border">›</span>
            <span>Article</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {grouped.length === 0 ? (
          <EmptyState
            emoji="📚"
            title="Collections coming soon"
            description="We are building curated learning paths. Check back soon or explore categories."
            action={{ label: "Browse Categories", href: `/${lang}/categories` }}
          />
        ) : (
          <div className="space-y-16">
            {grouped.map(({ category, collections }) => {
              const catMeta = CATEGORY_META[category.slug] ?? { emoji: "📖", color: "text-primary", bg: "bg-muted" };
              const collIcon = COLLECTION_ICONS[category.slug] ?? "📘";
              return (
                <section key={category.id}>
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${catMeta.bg}`}>
                        {catMeta.emoji}
                      </span>
                      <div>
                        <Link
                          href={`/${lang}/categories/${category.slug}`}
                          className={`text-lg font-bold hover:opacity-80 transition-opacity ${catMeta.color}`}
                        >
                          {category.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {collections.length} collection{collections.length !== 1 ? "s" : ""}
                          {category.topic_count > 0 && ` · ${category.topic_count} topics`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/${lang}/categories/${category.slug}`}
                      className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      View all in {category.name} →
                    </Link>
                  </div>

                  {/* Collection cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {collections.map((col) => {
                      const diff = DIFFICULTY_CONFIG[col.difficulty];
                      const hasContent = col.topic_count > 0 || col.article_count > 0;
                      return (
                        <Link
                          key={col.id}
                          href={`/${lang}/collections/${col.slug}`}
                          className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
                        >
                          {/* Icon + title row */}
                          <div className="flex items-start gap-3">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${catMeta.bg}`}>
                              {collIcon}
                            </span>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                {col.name}
                              </h3>
                            </div>
                          </div>

                          {/* Description */}
                          {col.description ? (
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {col.description}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm text-muted-foreground/60 italic line-clamp-2">
                              A structured learning path in {category.name}.
                            </p>
                          )}

                          {/* Stats row */}
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {col.topic_count > 0 && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span><strong className="text-foreground/80">{col.topic_count}</strong> topic{col.topic_count !== 1 ? "s" : ""}</span>
                              </span>
                            )}
                            {col.article_count > 0 && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span><strong className="text-foreground/80">{col.article_count}</strong> article{col.article_count !== 1 ? "s" : ""}</span>
                              </span>
                            )}
                            {col.estimated_hours > 0 && hasContent && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                                </svg>
                                <span>~{col.estimated_hours}h</span>
                              </span>
                            )}
                          </div>

                          {/* Difficulty + CTA */}
                          <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${diff.color}`}>
                              {diff.label}
                            </span>
                            <span className="text-sm font-semibold text-primary group-hover:gap-2 flex items-center gap-1 transition-all">
                              Open Collection
                              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
