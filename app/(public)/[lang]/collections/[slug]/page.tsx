import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getCollectionBySlug,
  getTopicsByCollection,
  getArticlesByCollection,
  getCollectionsByCategory,
  CollectionDifficulty,
} from "@/services/public/publicData";
import { LatestArticles } from "@/components/public/LatestArticles";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EmptyState } from "@/components/public/EmptyState";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;
export const dynamicParams = true;

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  technology:         { emoji: "💻", color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-950/40" },
  "personal-finance": { emoji: "💰", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  business:           { emoji: "🚀", color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-950/40" },
  education:          { emoji: "📚", color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-950/40" },
  "health-wellness":  { emoji: "🏃", color: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-950/40" },
  "home-lifestyle":   { emoji: "🏠", color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-950/40" },
  travel:             { emoji: "✈️", color: "text-sky-600 dark:text-sky-400",        bg: "bg-sky-50 dark:bg-sky-950/40" },
};

const DIFFICULTY_CONFIG: Record<CollectionDifficulty, { label: string; dot: string; bar: string }> = {
  Beginner:     { label: "Beginner",     dot: "bg-emerald-500", bar: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
  Intermediate: { label: "Intermediate", dot: "bg-amber-500",   bar: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400" },
  Advanced:     { label: "Advanced",     dot: "bg-rose-500",     bar: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400" },
};

/** Generate "What you'll learn" objectives from the topic list */
function buildLearningObjectives(topicTitles: string[]): string[] {
  if (topicTitles.length === 0) return [];
  const sample = topicTitles.slice(0, 5);
  return sample.map((t) => `Understand ${t.toLowerCase()}`);
}

async function getCategoryById(categoryId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("id", categoryId)
    .eq("category_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, slug: data.slug, name: (data.category_translations as any)?.[0]?.name || "Category" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  return buildMetadata({
    title: `${collection.name} — Valendiro`,
    description:
      collection.description ||
      `A structured learning path covering ${collection.name}. ${collection.topic_count} topics, ${collection.article_count} articles.`,
    canonical: `/${lang}/collections/${slug}`,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [topics, articles, relatedCollections, parentCategory] = await Promise.all([
    getTopicsByCollection(collection.id, 24),
    getArticlesByCollection(collection.id, 6),
    getCollectionsByCategory(collection.category_id, 8),
    collection.category_id ? getCategoryById(collection.category_id) : null,
  ]);

  const siblings = relatedCollections.filter((c) => c.slug !== slug).slice(0, 4);
  const diff = DIFFICULTY_CONFIG[collection.difficulty];
  const catMeta = CATEGORY_META[parentCategory?.slug ?? ""] ?? { emoji: "📖", color: "text-primary", bg: "bg-muted" };
  const objectives = buildLearningObjectives(topics.map((t) => t.title));

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: "Collections", href: `/${lang}/collections`, isCurrent: false },
    ...(parentCategory
      ? [{ name: parentCategory.name, href: `/${lang}/categories/${parentCategory.slug}`, isCurrent: false }]
      : []),
    { name: collection.name, href: `/${lang}/collections/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: `${SITE_URL}/${lang}/collections/${slug}`,
    numberOfItems: topics.length,
  };

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-6 flex flex-col lg:flex-row lg:items-start lg:gap-12">
            {/* Left: text content */}
            <div className="flex-1 min-w-0">
              {/* Category tag */}
              {parentCategory && (
                <Link
                  href={`/${lang}/categories/${parentCategory.slug}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${catMeta.bg} ${catMeta.color}`}
                >
                  <span>{catMeta.emoji}</span>
                  <span>{parentCategory.name}</span>
                </Link>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                {collection.name}
              </h1>

              {collection.description && (
                <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {collection.description}
                </p>
              )}

              {/* Meta pills */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${diff.bar}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                  {diff.label}
                </span>

                {topics.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {topics.length} Topic{topics.length !== 1 ? "s" : ""}
                  </span>
                )}

                {collection.article_count > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {collection.article_count} Article{collection.article_count !== 1 ? "s" : ""}
                  </span>
                )}

                {collection.estimated_hours > 0 && topics.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    ~{collection.estimated_hours}h estimated
                  </span>
                )}
              </div>
            </div>

            {/* Right: hierarchy pill (desktop) */}
            <div className="hidden lg:flex shrink-0 flex-col items-end gap-2 pt-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">You are here</p>
              <div className="flex flex-col items-end gap-1 text-xs">
                {parentCategory && (
                  <Link href={`/${lang}/categories/${parentCategory.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
                    {parentCategory.name}
                  </Link>
                )}
                <div className="flex items-center gap-1 text-muted-foreground/50">
                  <span className="w-4 border-b border-dashed border-muted-foreground/30" />
                </div>
                <span className={`font-semibold ${catMeta.color}`}>{collection.name}</span>
                <div className="flex items-center gap-1 text-muted-foreground/50">
                  <span className="w-4 border-b border-dashed border-muted-foreground/30" />
                </div>
                <span className="text-muted-foreground">Topics &amp; Articles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">

          {/* ── Main column ─────────────────────────────────────────────────── */}
          <div className="space-y-14 min-w-0">

            {/* What you'll learn */}
            {objectives.length > 0 && (
              <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
                <h2 className="text-lg font-bold text-foreground mb-4">What you&apos;ll learn</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{obj}</span>
                    </li>
                  ))}
                  {topics.length > 5 && (
                    <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>And {topics.length - 5} more topic{topics.length - 5 !== 1 ? "s" : ""} in this collection</span>
                    </li>
                  )}
                </ul>
              </section>
            )}

            {/* Learning Path — ordered topic list */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Learning Path</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {topics.length > 0
                      ? `${topics.length} topic${topics.length !== 1 ? "s" : ""} — work through them in order for the best learning experience`
                      : "Topics are being prepared for this collection"}
                  </p>
                </div>
              </div>

              {topics.length > 0 ? (
                <div className="relative">
                  {/* Vertical progress line */}
                  <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border/60 hidden sm:block" aria-hidden />

                  <ol className="space-y-3">
                    {topics.map((topic, i) => (
                      <li key={topic.id}>
                        <Link
                          href={`/${lang}/topics/${topic.slug}`}
                          className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                          {/* Step number */}
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border/60 bg-background text-xs font-bold text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                            {i + 1}
                          </span>

                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                              {topic.title}
                            </h3>
                            {topic.subtitle && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-1 leading-relaxed">
                                {topic.subtitle}
                              </p>
                            )}
                          </div>

                          <svg className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <EmptyState
                  emoji="📖"
                  title="Topics coming soon"
                  description="Topics for this collection are being prepared. Check back soon."
                />
              )}
            </section>

            {/* Featured Articles */}
            {articles.length > 0 && (
              <section>
                <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">Featured Articles</h2>
                <LatestArticles lang={lang} articles={articles} />
              </section>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="space-y-6">

            {/* Collection summary card */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Collection Overview</h3>

              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">Difficulty</dt>
                  <dd>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.bar}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                      {diff.label}
                    </span>
                  </dd>
                </div>

                {topics.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">Topics</dt>
                    <dd className="font-semibold text-foreground">{topics.length}</dd>
                  </div>
                )}

                {collection.article_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">Articles</dt>
                    <dd className="font-semibold text-foreground">{collection.article_count}</dd>
                  </div>
                )}

                {collection.estimated_hours > 0 && topics.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">Est. time</dt>
                    <dd className="font-semibold text-foreground">~{collection.estimated_hours}h</dd>
                  </div>
                )}

                {parentCategory && (
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>
                      <Link href={`/${lang}/categories/${parentCategory.slug}`} className={`font-semibold hover:opacity-80 transition-opacity ${catMeta.color}`}>
                        {parentCategory.name}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>

              {/* Hierarchy */}
              <div className="pt-4 border-t border-border/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Knowledge Hierarchy</p>
                <div className="space-y-1.5 text-xs">
                  {parentCategory && (
                    <Link href={`/${lang}/categories/${parentCategory.slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      {parentCategory.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 pl-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="font-semibold text-foreground">{collection.name}</span>
                  </div>
                  {topics.slice(0, 3).map((t) => (
                    <Link key={t.id} href={`/${lang}/topics/${t.slug}`} className="flex items-center gap-2 pl-8 text-muted-foreground hover:text-primary transition-colors">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span className="line-clamp-1">{t.title}</span>
                    </Link>
                  ))}
                  {topics.length > 3 && (
                    <p className="pl-8 text-muted-foreground/50">+{topics.length - 3} more topics</p>
                  )}
                </div>
              </div>
            </div>

            {/* Related collections */}
            {siblings.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-6">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  Related Collections
                </h3>
                <ul className="space-y-2">
                  {siblings.map((c) => {
                    const sd = DIFFICULTY_CONFIG[c.difficulty];
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/${lang}/collections/${c.slug}`}
                          className="group flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-background/60 p-3.5 hover:border-primary/40 hover:bg-card transition-all"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {c.name}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                              {c.topic_count > 0 && <span>{c.topic_count} topics</span>}
                              {c.topic_count > 0 && <span>·</span>}
                              <span className={`font-medium ${sd.bar.split(" ")[0]}`}>{sd.label}</span>
                            </div>
                          </div>
                          <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {parentCategory && (
                  <Link
                    href={`/${lang}/categories/${parentCategory.slug}`}
                    className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    View all {parentCategory.name} collections →
                  </Link>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
