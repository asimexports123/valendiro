import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getArticleBySlug, getRelatedArticles, extractHeadings, getQuestionsByCategory } from "@/services/public/publicData";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";

export const revalidate = 3600;
export const dynamicParams = true;

const CATEGORY_ACCENT: Record<string, { bg: string; heroBg: string; text: string; border: string; iconBg: string; emoji: string }> = {
  technology:         { bg: "bg-blue-50 dark:bg-blue-950/30",     heroBg: "from-blue-50 via-white to-white dark:from-blue-950/40 dark:via-background dark:to-background",     text: "text-blue-700 dark:text-blue-300",     border: "border-blue-200 dark:border-blue-800",     iconBg: "bg-blue-100 dark:bg-blue-900/50",     emoji: "💻" },
  "personal-finance": { bg: "bg-emerald-50 dark:bg-emerald-950/30", heroBg: "from-emerald-50 via-white to-white dark:from-emerald-950/40 dark:via-background dark:to-background", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", iconBg: "bg-emerald-100 dark:bg-emerald-900/50", emoji: "💰" },
  business:           { bg: "bg-violet-50 dark:bg-violet-950/30",   heroBg: "from-violet-50 via-white to-white dark:from-violet-950/40 dark:via-background dark:to-background",   text: "text-violet-700 dark:text-violet-300",   border: "border-violet-200 dark:border-violet-800",   iconBg: "bg-violet-100 dark:bg-violet-900/50",   emoji: "📈" },
  education:          { bg: "bg-amber-50 dark:bg-amber-950/30",     heroBg: "from-amber-50 via-white to-white dark:from-amber-950/40 dark:via-background dark:to-background",     text: "text-amber-700 dark:text-amber-300",     border: "border-amber-200 dark:border-amber-800",     iconBg: "bg-amber-100 dark:bg-amber-900/50",     emoji: "🎓" },
  "health-wellness":  { bg: "bg-rose-50 dark:bg-rose-950/30",       heroBg: "from-rose-50 via-white to-white dark:from-rose-950/40 dark:via-background dark:to-background",       text: "text-rose-700 dark:text-rose-300",       border: "border-rose-200 dark:border-rose-800",       iconBg: "bg-rose-100 dark:bg-rose-900/50",       emoji: "🌿" },
  "home-lifestyle":   { bg: "bg-orange-50 dark:bg-orange-950/30",   heroBg: "from-orange-50 via-white to-white dark:from-orange-950/40 dark:via-background dark:to-background",   text: "text-orange-700 dark:text-orange-300",   border: "border-orange-200 dark:border-orange-800",   iconBg: "bg-orange-100 dark:bg-orange-900/50",   emoji: "🏠" },
  travel:             { bg: "bg-sky-50 dark:bg-sky-950/30",         heroBg: "from-sky-50 via-white to-white dark:from-sky-950/40 dark:via-background dark:to-background",         text: "text-sky-700 dark:text-sky-300",         border: "border-sky-200 dark:border-sky-800",         iconBg: "bg-sky-100 dark:bg-sky-900/50",         emoji: "✈️" },
};
const DEFAULT_ACCENT = { bg: "bg-muted/30", heroBg: "from-muted/30 via-background to-background", text: "text-foreground", border: "border-border", iconBg: "bg-muted", emoji: "📄" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: `${article.title} — Valendiro`,
    description: article.meta_description || article.excerpt || `Read ${article.title} on Valendiro.`,
    canonical: `/${lang}/articles/${slug}`,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [relatedArticles, category, collection, topic, faqs] = await Promise.all([
    getRelatedArticles(article.id, article.topic_id, article.category_id, 4),
    article.category_id ? getCategoryBySlugForArticle(article.category_id) : null,
    article.collection_id ? getCollectionBySlugForArticle(article.collection_id) : null,
    article.topic_id ? getTopicBySlugForArticle(article.topic_id) : null,
    article.category_id ? getQuestionsByCategory(article.category_id, 5) : Promise.resolve([]),
  ]);

  const headings = extractHeadings(article.content);
  const accent = CATEGORY_ACCENT[category?.slug ?? ""] ?? DEFAULT_ACCENT;

  /* Full 4-level breadcrumb: Home > Category > Collection > Topic > Article */
  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    ...(category ? [{ name: category.name, href: `/${lang}/categories/${category.slug}`, isCurrent: false }] : []),
    ...(collection ? [{ name: collection.name, href: `/${lang}/collections/${collection.slug}`, isCurrent: false }] : []),
    ...(topic ? [{ name: topic.title, href: `/${lang}/topics/${topic.slug}`, isCurrent: false }] : []),
    { name: article.title, href: `/${lang}/articles/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    url: `${SITE_URL}/${lang}/articles/${slug}`,
    isPartOf: collection ? { "@type": "Collection", name: collection.name } : undefined,
  };

  return (
    <>
      {/* ── Hero banner ────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-b ${accent.heroBg} border-b ${accent.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-10 sm:pb-14">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-6 max-w-3xl">
            {/* Category + type tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {category && (
                <Link
                  href={`/${lang}/categories/${category.slug}`}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-75 ${accent.text} ${accent.border} ${accent.bg}`}
                >
                  <span>{accent.emoji}</span>
                  <span>{category.name}</span>
                </Link>
              )}
              <span className="rounded-full bg-muted border border-border/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Article
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-foreground leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Meta bar */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                {article.reading_time} min read
              </span>
              {article.updated_at && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Updated {new Date(article.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {topic && (
                <Link href={`/${lang}/topics/${topic.slug}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {topic.title}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">

          {/* ── Article content ───────────────────────────────────── */}
          <article className="min-w-0">
            {/* Table of Contents */}
            {headings.length > 1 && (
              <nav aria-label="Table of contents" className="mb-10 rounded-2xl border border-border/60 bg-card p-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">On this page</h2>
                <ol className="space-y-2">
                  {headings.map((heading) => (
                    <li key={heading.id} className={heading.level === 3 ? "pl-4" : ""}>
                      <Link href={`#${heading.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {heading.text}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {article.content && (
              <div className="max-w-3xl prose-headings:scroll-mt-24">
                <MarkdownContent content={article.content} />
              </div>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="mt-14">
                <FaqSection questions={faqs} />
              </div>
            )}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-14">
                <h2 className="text-xl font-bold tracking-tight text-foreground mb-5">Related Articles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedArticles.map((item) => (
                    <Link
                      key={item.id}
                      href={`/${lang}/articles/${item.slug}`}
                      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                      <span className="mt-3 text-xs text-muted-foreground">{item.reading_time} min read →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="space-y-5">

            {/* Knowledge Hierarchy card — visual tree */}
            {(category || collection || topic) && (
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  Knowledge Hierarchy
                </h3>

                <div className="space-y-1 text-sm">
                  {/* Level 1: Category */}
                  {category ? (
                    <Link
                      href={`/${lang}/categories/${category.slug}`}
                      className={`flex items-center gap-2 font-medium hover:opacity-80 transition-opacity ${accent.text}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${accent.iconBg}`}>
                        {accent.emoji}
                      </span>
                      {category.name}
                    </Link>
                  ) : null}

                  {/* Level 2: Collection */}
                  {collection && (
                    <div className="pl-3 pt-0.5">
                      <div className="flex items-stretch gap-2">
                        <div className="w-px bg-border/60 self-stretch ml-2.5" />
                        <Link
                          href={`/${lang}/collections/${collection.slug}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors py-0.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] bg-muted">
                            📂
                          </span>
                          <span className="line-clamp-1">{collection.name}</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Level 3: Topic */}
                  {topic && (
                    <div className="pl-6 pt-0.5">
                      <div className="flex items-stretch gap-2">
                        <div className="w-px bg-border/60 self-stretch ml-2.5" />
                        <Link
                          href={`/${lang}/topics/${topic.slug}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors py-0.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] bg-muted">
                            📖
                          </span>
                          <span className="line-clamp-1">{topic.title}</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Level 4: Article (current — highlighted) */}
                  <div className={`pl-9 pt-0.5`}>
                    <div className="flex items-center gap-2 py-0.5">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] ${accent.iconBg}`}>
                        📄
                      </span>
                      <span className={`text-xs font-semibold line-clamp-2 ${accent.text}`}>
                        {article.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* You are here label */}
                <p className={`mt-3 text-[10px] font-semibold uppercase tracking-wider ${accent.text} opacity-60`}>
                  ↑ You are here
                </p>
              </div>
            )}

            {/* Back to topic CTA */}
            {topic && (
              <Link
                href={`/${lang}/topics/${topic.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Back to topic</p>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {topic.title}
                  </p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            {/* Back to collection CTA */}
            {collection && (
              <Link
                href={`/${lang}/collections/${collection.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Collection</p>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {collection.name}
                  </p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </aside>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}

async function getCategoryBySlugForArticle(categoryId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("id", categoryId)
    .eq("category_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.category_translations?.[0]?.name || "Category",
  };
}

async function getCollectionBySlugForArticle(collectionId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("collections")
    .select("id, slug, collection_translations(name)")
    .eq("id", collectionId)
    .eq("collection_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.collection_translations?.[0]?.name || "Collection",
  };
}

async function getTopicBySlugForArticle(topicId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.topic_translations?.[0]?.title || "Topic",
  };
}
