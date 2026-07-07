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
import { ReadingProgress } from "@/components/public/ReadingProgress";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";

export const revalidate = 60;
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

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
      {/* Reading Progress Indicator */}
      <ReadingProgress />

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex gap-8 lg:gap-12 xl:gap-16">

          {/* Main column - reduced width for readability */}
          <div className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl">

            {/* Key Takeaways - Premium colored checklist cards */}
            {keyTakeaways.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">✨</span>
                    Key Takeaways
                  </h2>
                </div>
                <div className="grid gap-4">
                  {keyTakeaways.map((t, i) => (
                    <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-primary/10 hover:border-primary/20 transition-all">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed flex-1">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Article content */}
            {topic.content && (
              <MarkdownContent content={topic.content} />
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Prerequisites - Premium insight cards */}
            {semanticRecommendations.prerequisites.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </span>
                    Prerequisites
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {semanticRecommendations.prerequisites.map((rec) => (
                    <Link key={rec.topicId} href={`/${lang}/topics/${rec.topicSlug}`}
                      className="group p-5 rounded-xl bg-gradient-to-br from-blue-50/50 via-blue-50/20 to-transparent dark:from-blue-950/20 dark:via-blue-950/10 dark:to-transparent border border-blue-200/50 dark:border-blue-800/30 hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">{rec.topicTitle}</h4>
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{rec.relationshipReason}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Knowledge Graph Visualization - Always show */}
            <div className="mb-16">
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
            </div>

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Continue Learning (from Learning Journey) - Premium learning path cards */}
            {(learningJourney.continueWith.length > 0 || learningJourney.completed.length > 0) && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </span>
                    Continue Learning
                  </h2>
                </div>
                <div className="space-y-3">
                  {learningJourney.continueWith.map((slug, index) => (
                    <Link
                      key={slug}
                      href={`/${lang}/topics/${slug}`}
                      className="group flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-violet-50/50 via-violet-50/20 to-transparent dark:from-violet-950/20 dark:via-violet-950/10 dark:to-transparent border border-violet-200/50 dark:border-violet-800/30 hover:border-violet-400/50 dark:hover:border-violet-600/50 hover:shadow-md transition-all"
                    >
                      <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${index === 0 ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'bg-violet-500/10 text-violet-500'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{slug}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Recommended next topic</div>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Applications - Premium topic cards */}
            {semanticRecommendations.applications.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </span>
                    Applications
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {semanticRecommendations.applications.map((rec) => (
                    <Link key={rec.topicId} href={`/${lang}/topics/${rec.topicSlug}`}
                      className="group p-5 rounded-xl bg-gradient-to-br from-amber-50/50 via-amber-50/20 to-transparent dark:from-amber-950/20 dark:via-amber-950/10 dark:to-transparent border border-amber-200/50 dark:border-amber-800/30 hover:border-amber-400/50 dark:hover:border-amber-600/50 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-sm">{rec.topicTitle}</h4>
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{rec.relationshipReason}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Related Articles - Premium topic cards */}
            {relatedArticles.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Related Guides
                  </h2>
                </div>
                <div className="space-y-3">
                  {relatedArticles.map((article) => (
                    <Link key={article.id} href={`/${lang}/articles/${article.slug}`}
                      className="group flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-emerald-50/50 via-emerald-50/20 to-transparent dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-transparent border border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-400/50 dark:hover:border-emerald-600/50 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">{article.title}</h4>
                        {article.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {article.reading_time} min read
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Sequential Navigation (Previous/Next) - Premium navigation cards */}
            {sequentialNav && (sequentialNav.previous || sequentialNav.next) && (
              <div className="mb-16 flex items-center justify-between gap-4 sm:gap-6">
                {sequentialNav.previous && (
                  <Link
                    href={`/${lang}/topics/${sequentialNav.previous.slug}`}
                    className="flex-1 group p-5 rounded-xl bg-gradient-to-br from-slate-50/50 via-slate-50/20 to-transparent dark:from-slate-950/20 dark:via-slate-950/10 dark:to-transparent border border-slate-200/50 dark:border-slate-800/30 hover:border-slate-400/50 dark:hover:border-slate-600/50 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Previous</span>
                    </div>
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">{sequentialNav.previous.title}</div>
                  </Link>
                )}
                <div className="flex-1" /> {/* Spacer */}
                {sequentialNav.next && (
                  <Link
                    href={`/${lang}/topics/${sequentialNav.next.slug}`}
                    className="flex-1 group p-5 rounded-xl bg-gradient-to-br from-slate-50/50 via-slate-50/20 to-transparent dark:from-slate-950/20 dark:via-slate-950/10 dark:to-transparent border border-slate-200/50 dark:border-slate-800/30 hover:border-slate-400/50 dark:hover:border-slate-600/50 hover:shadow-md transition-all text-right"
                  >
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next</span>
                      <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">{sequentialNav.next.title}</div>
                  </Link>
                )}
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Articles in this topic — Premium numbered cards */}
            {topicArticles.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                    Articles in this topic
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{topicArticles.length} article{topicArticles.length !== 1 ? "s" : ""} — read in any order</p>
                </div>
                <ol className="space-y-3">
                  {topicArticles.map((a, i) => (
                    <li key={a.id}>
                      <Link
                        href={`/${lang}/articles/${a.slug}`}
                        className="group flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-rose-50/30 via-rose-50/10 to-transparent dark:from-rose-950/20 dark:via-rose-950/10 dark:to-transparent border border-rose-200/40 dark:border-rose-800/30 hover:border-rose-400/50 dark:hover:border-rose-600/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold bg-rose-500 text-white shadow-lg shadow-rose-500/25 mt-0.5`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors text-sm leading-snug">
                            {a.title}
                          </h3>
                          {a.description && (
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 pt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {a.reading_time} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* FAQ - Premium accordion */}
            {faqs.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Frequently Asked Questions
                  </h2>
                </div>
                <FaqSection questions={faqs} />
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Same Category Topics - Premium topic cards */}
            {categoryTopics.length > 0 && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </span>
                    More in {category?.name || "This Category"}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {categoryTopics.map((t) => (
                    <Link key={t.id} href={`/${lang}/topics/${t.slug}`}
                      className="group p-5 rounded-xl bg-gradient-to-br from-indigo-50/50 via-indigo-50/20 to-transparent dark:from-indigo-950/20 dark:via-indigo-950/10 dark:to-transparent border border-indigo-200/50 dark:border-indigo-800/30 hover:border-indigo-400/50 dark:hover:border-indigo-600/50 hover:shadow-md transition-all">
                      <h4 className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">{t.title}</h4>
                      {t.subtitle && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{t.subtitle}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section separator */}
            <div className="my-16 border-t border-border/20" />

            {/* Same Subcategory Topics - Premium topic cards */}
            {subcategoryTopics.length > 0 && subcategory && (
              <div className="mb-16">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </span>
                    More in {subcategory.name}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {subcategoryTopics.map((t) => (
                    <Link key={t.id} href={`/${lang}/topics/${t.slug}`}
                      className="group p-5 rounded-xl bg-gradient-to-br from-pink-50/50 via-pink-50/20 to-transparent dark:from-pink-950/20 dark:via-pink-950/10 dark:to-transparent border border-pink-200/50 dark:border-pink-800/30 hover:border-pink-400/50 dark:hover:border-pink-600/50 hover:shadow-md transition-all">
                      <h4 className="font-semibold text-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors text-sm">{t.title}</h4>
                      {t.subtitle && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{t.subtitle}</p>}
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
