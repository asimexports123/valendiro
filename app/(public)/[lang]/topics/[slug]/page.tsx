import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getTopicBySlug, getRelatedTopics, getArticlesByTopic, getQuestionsByTopic, getTopicsByCategory, getTopicsBySubcategorySimple, getSequentialNavigation } from "@/services/public/publicData";
import { getSemanticRecommendations, getLearningJourney } from "@/services/knowledge/knowledgeGraph";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { FaqSection } from "@/components/public/FaqSection";
import { TableOfContents } from "@/components/public/TableOfContents";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { KnowledgeGraph } from "@/components/public/KnowledgeGraph";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";

export const revalidate = 3600;
export const dynamicParams = true;

const CATEGORY_ACCENT: Record<string, { bg: string; text: string; border: string }> = {
  technology:       { bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-700 dark:text-blue-300",    border: "border-blue-200 dark:border-blue-800" },
  business:         { bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-700 dark:text-amber-300",  border: "border-amber-200 dark:border-amber-800" },
  "personal-finance":{ bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  education:        { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  "health-wellness":{ bg: "bg-rose-50 dark:bg-rose-950/30",   text: "text-rose-700 dark:text-rose-300",    border: "border-rose-200 dark:border-rose-800" },
  "home-lifestyle": { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  travel:           { bg: "bg-sky-50 dark:bg-sky-950/30",     text: "text-sky-700 dark:text-sky-300",     border: "border-sky-200 dark:border-sky-800" },
};

function estimateReadingTime(content: string | null): number {
  if (!content) return 1;
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
}

function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/\*\*/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      headings.push({ id, text, level: m[1].length });
    }
  }
  return headings;
}

function extractKeyTakeaways(content: string): string[] {
  const lines = content.split("\n");
  const takeaways: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (/^#{1,3}\s.*(key takeaway|what you.ll learn|summary|in brief)/i.test(line)) { inSection = true; continue; }
    if (inSection && /^#{1,3}\s/.test(line)) break;
    if (inSection && /^[-*]\s+(.+)/.test(line)) {
      const m = line.match(/^[-*]\s+(.+)/);
      if (m) takeaways.push(m[1].replace(/\*\*/g, "").trim());
    }
  }
  return takeaways.slice(0, 5);
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return {};
  return buildMetadata({
    title: `${topic.title} — Valendiro`,
    description: topic.meta_description || topic.subtitle || `Learn about ${topic.title} on Valendiro.`,
    canonical: `/${lang}/topics/${slug}`,
  });
}

export default async function TopicPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const [semanticRecommendations, learningJourney, topicArticles, faqs, subcategory, categoryTopics, subcategoryTopics, sequentialNav] = await Promise.all([
    getSemanticRecommendations(topic.id, topic.category_id, 9),
    getLearningJourney(topic.id, 5),
    getArticlesByTopic(topic.id, 12),
    getQuestionsByTopic(topic.id, 5),
    topic.subcategory_id ? getCollectionBySlugFromId(topic.subcategory_id) : null,
    topic.category_id ? getTopicsByCategory(topic.category_id, 6) : [],
    topic.subcategory_id ? getTopicsBySubcategorySimple(topic.subcategory_id, 6) : [],
    topic.category_id ? getSequentialNavigation(topic.id, topic.category_id) : null,
  ]);

  const category = topic.category_id ? await getCategoryBySlugFromId(topic.category_id) : null;
  const relatedArticles = topicArticles.slice(0, 4);
  const accent = CATEGORY_ACCENT[category?.slug ?? ""] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
  const readingTime = estimateReadingTime(topic.content);
  const headings = topic.content ? extractHeadings(topic.content) : [];
  const keyTakeaways = topic.content ? extractKeyTakeaways(topic.content) : [];

  /* Full breadcrumb: Home > Category > Collection > Topic */
  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    ...(category ? [{ name: category.name, href: `/${lang}/categories/${category.slug}`, isCurrent: false }] : []),
    ...(subcategory ? [{ name: subcategory.name, href: `/${lang}/subcategories/${subcategory.slug}`, isCurrent: false }] : []),
    { name: topic.title, href: `/${lang}/topics/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.subtitle || topic.meta_description,
    url: `${SITE_URL}/${lang}/topics/${slug}`,
    dateModified: topic.updated_at,
  };

  return (
    <div>
      {/* Hero banner */}
      <div className={`border-b border-border/50 ${accent.bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-5 max-w-3xl">
            {category && (
              <Link href={`/${lang}/categories/${category.slug}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-4 transition-opacity hover:opacity-75 ${accent.text} ${accent.border} ${accent.bg}`}>
                {category.name}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.15]">
              {topic.title}
            </h1>
            {topic.subtitle && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">{topic.subtitle}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                {readingTime} min read
              </span>
              {topic.updated_at && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Updated {new Date(topic.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              {subcategory && (
                <Link href={`/${lang}/subcategories/${subcategory.slug}`}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {subcategory.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex gap-12 lg:gap-16">

          {/* Main column */}
          <div className="flex-1 min-w-0 max-w-3xl">

            {/* Key Takeaways */}
            {keyTakeaways.length > 0 && (
              <div className="mb-10 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-xl">✨</span>
                  <h2 className="text-base font-semibold text-foreground">Key Takeaways</h2>
                </div>
                <ul className="space-y-2.5">
                  {keyTakeaways.map((t, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article content */}
            {topic.content && (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: topic.content
                    .replace(/## Sources\n[\s\S]*?(?=\n##|$)/g, "")
                    .replace(/### Sources\n[\s\S]*?(?=\n##|$)/g, "")
                    .replace(/#### Sources\n[\s\S]*?(?=\n##|$)/g, "")
                }}
                className="prose max-w-none"
              />
            )}

            {/* Prerequisites */}
            {semanticRecommendations.prerequisites.length > 0 && (
              <div className="mt-14 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-xl">📖</span>
                  <h3 className="text-base font-semibold text-foreground">Prerequisites</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {semanticRecommendations.prerequisites.map((rec) => (
                    <Link key={rec.topicId} href={`/${lang}/topics/${rec.topicSlug}`}
                      className="group rounded-xl border border-border/60 bg-muted/50 p-4 hover:border-primary/30 hover:bg-primary/5 transition-all">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{rec.topicTitle}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{rec.relationshipReason}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Graph Visualization - Always show */}
            <KnowledgeGraph
              prerequisites={semanticRecommendations.prerequisites.map(r => ({
                id: r.topicId,
                slug: r.topicSlug,
                title: r.topicTitle,
                relationship: r.relationshipReason,
              }))}
              currentTopic={{ title: topic.title }}
              nextTopics={semanticRecommendations.nextTopics.map(r => ({
                id: r.topicId,
                slug: r.topicSlug,
                title: r.topicTitle,
                relationship: r.relationshipReason,
              }))}
              applications={semanticRecommendations.applications.map(r => ({
                id: r.topicId,
                slug: r.topicSlug,
                title: r.topicTitle,
                relationship: r.relationshipReason,
              }))}
              lang={lang}
            />

            {/* Continue Learning (from Learning Journey) */}
            {(learningJourney.continueWith.length > 0 || learningJourney.completed.length > 0) && (
              <div className="mt-14 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-xl">📚</span>
                  <h3 className="text-base font-semibold text-foreground">Continue Learning</h3>
                </div>
                <div className="space-y-3">
                  {learningJourney.continueWith.map((slug, index) => (
                    <Link
                      key={slug}
                      href={`/${lang}/topics/${slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">{slug}</div>
                        <div className="text-xs text-muted-foreground">Recommended next topic</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Applications */}
            {semanticRecommendations.applications.length > 0 && (
              <div className="mt-14 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-xl">🔧</span>
                  <h3 className="text-base font-semibold text-foreground">Applications</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {semanticRecommendations.applications.map((rec) => (
                    <Link key={rec.topicId} href={`/${lang}/topics/${rec.topicSlug}`}
                      className="group rounded-xl border border-border/60 bg-muted/50 p-4 hover:border-primary/30 hover:bg-primary/5 transition-all">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{rec.topicTitle}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{rec.relationshipReason}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-14 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-xl">📝</span>
                  <h3 className="text-base font-semibold text-foreground">Related Guides</h3>
                </div>
                <div className="space-y-3">
                  {relatedArticles.map((article) => (
                    <Link key={article.id} href={`/${lang}/articles/${article.slug}`}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/30 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{article.title}</h4>
                        {article.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{article.description}</p>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">{article.reading_time} min read</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Sequential Navigation (Previous/Next) */}
            {sequentialNav && (sequentialNav.previous || sequentialNav.next) && (
              <div className="mt-12 flex items-center justify-between gap-4 border-t border-border/60 pt-8">
                {sequentialNav.previous && (
                  <Link
                    href={`/${lang}/topics/${sequentialNav.previous.slug}`}
                    className="flex-1 rounded-xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all text-left"
                  >
                    <div className="text-xs text-muted-foreground mb-1">← Previous</div>
                    <div className="font-semibold text-foreground text-sm">{sequentialNav.previous.title}</div>
                  </Link>
                )}
                <div className="flex-1" /> {/* Spacer */}
                {sequentialNav.next && (
                  <Link
                    href={`/${lang}/topics/${sequentialNav.next.slug}`}
                    className="flex-1 rounded-xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all text-right"
                  >
                    <div className="text-xs text-muted-foreground mb-1">Next →</div>
                    <div className="font-semibold text-foreground text-sm">{sequentialNav.next.title}</div>
                  </Link>
                )}
              </div>
            )}

            {/* Articles in this topic — numbered list (spec: Topic Page = Articles List) */}
            {topicArticles.length > 0 && (
              <div className="mt-14">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Articles in this topic</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{topicArticles.length} article{topicArticles.length !== 1 ? "s" : ""} — read in any order</p>
                  </div>
                </div>
                <ol className="space-y-2">
                  {topicArticles.map((a, i) => (
                    <li key={a.id}>
                      <Link
                        href={`/${lang}/articles/${a.slug}`}
                        className="group flex items-start gap-4 rounded-xl border border-border/60 bg-card px-4 py-3.5 hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 border-border/60 bg-background text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors mt-0.5 ${accent.text}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                            {a.title}
                          </h3>
                          {a.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 pt-0.5">{a.reading_time} min</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="mt-14">
                <FaqSection questions={faqs} />
              </div>
            )}

            {/* Same Category Topics */}
            {categoryTopics.length > 0 && (
              <div className="mt-14">
                <h3 className="text-lg font-semibold text-foreground mb-4">More in {category?.name || "This Category"}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryTopics.map((t) => (
                    <Link key={t.id} href={`/${lang}/topics/${t.slug}`}
                      className="group rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{t.title}</h4>
                      {t.subtitle && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.subtitle}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Same Subcategory Topics */}
            {subcategoryTopics.length > 0 && subcategory && (
              <div className="mt-14">
                <h3 className="text-lg font-semibold text-foreground mb-4">More in {subcategory.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subcategoryTopics.map((t) => (
                    <Link key={t.id} href={`/${lang}/topics/${t.slug}`}
                      className="group rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{t.title}</h4>
                      {t.subtitle && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.subtitle}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky ToC sidebar */}
          {headings.length > 2 && (
            <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}

async function getCategoryBySlugFromId(categoryId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("id", categoryId)
    .eq("category_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, slug: data.slug, name: data.category_translations?.[0]?.name || "Category" };
}

async function getCollectionBySlugFromId(subcategoryId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subcategories")
    .select("id, slug, subcategory_translations(name)")
    .eq("id", subcategoryId)
    .eq("subcategory_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, slug: data.slug, name: data.subcategory_translations?.[0]?.name || "Subcategory" };
}
