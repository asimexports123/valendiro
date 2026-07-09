import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getTopicBySlug,
  getQuestionsByTopic,
  getSequentialNavigation,
} from "@/services/public/publicData";
import { getSemanticRecommendations, getLearningJourney } from "@/services/knowledge/knowledgeGraph";
import { getConnectedTopics } from "@/services/knowledge/connectedTopics";
import { FaqSection } from "@/components/public/FaqSection";
import { TableOfContents } from "@/components/public/TableOfContents";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ReadingProgress } from "@/components/public/ReadingProgress";
import { ArticleReaderBody } from "@/components/reader/ArticleReaderBody";
import { ArticleFooter } from "@/components/reader/ArticleFooter";
import { RelatedToolsSection } from "@/components/tools/RelatedToolsSection";
import { parseArticleContent, extractHeadings, estimateReadingTime } from "@/lib/reader/contentParser";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";

export const revalidate = 3600;
export const dynamicParams = true;

const CATEGORY_ACCENT: Record<string, { bg: string; text: string; border: string }> = {
  technology: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  business: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  "personal-finance": { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  education: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  "health-wellness": { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  "home-lifestyle": { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  travel: { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
};

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

  const [semanticRecommendations, learningJourney, faqs, subcategory, sequentialNav, connectedTopics] =
    await Promise.all([
      getSemanticRecommendations(topic.id, topic.category_id, 9),
      getLearningJourney(topic.id, 5),
      getQuestionsByTopic(topic.id, 5),
      topic.subcategory_id ? getCollectionBySlugFromId(topic.subcategory_id) : null,
      topic.category_id ? getSequentialNavigation(topic.id, topic.category_id) : null,
      getConnectedTopics(topic.id, slug, topic.subcategory_id, 6),
    ]);

  const category = topic.category_id ? await getCategoryBySlugFromId(topic.category_id) : null;
  const accent = CATEGORY_ACCENT[category?.slug ?? ""] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
  const readingTime = estimateReadingTime(topic.content);
  const headings = topic.content ? extractHeadings(topic.content) : [];
  const parsed = topic.content ? parseArticleContent(topic.content) : null;

  const breadcrumbs = [
    { name: "Home", href: "/", isCurrent: false },
    ...(category ? [{ name: category.name, href: `/${lang}/categories/${category.slug}`, isCurrent: false }] : []),
    { name: topic.title, href: `/${lang}/topics/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.subtitle || topic.meta_description,
    url: `${SITE_URL}/${lang}/topics/${slug}`,
    dateModified: topic.updated_at,
    datePublished: topic.updated_at,
    ...(topic.trust.lastReviewed ? { dateReviewed: topic.trust.lastReviewed } : {}),
    ...(topic.citations.length > 0
      ? {
          citation: topic.citations.map((c) => ({
            "@type": "CreativeWork",
            name: c.sourceName,
            ...(c.sourceUrl ? { url: c.sourceUrl } : {}),
          })),
        }
      : {}),
  };

  return (
    <div className="bg-background">
      <ReadingProgress />

      {/* Hero */}
      <header className={`border-b border-border/40 ${accent.bg}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-3xl">
            <Breadcrumbs items={breadcrumbs} size="sm" separator="chevron" />
            <div className="mt-3">
            {category && (
              <Link
                href={`/${lang}/categories/${category.slug}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold mb-3 transition-opacity hover:opacity-75 ${accent.text} ${accent.border}`}
              >
                {category.name}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
              {topic.title}
            </h1>
            {topic.subtitle && (
              <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">{topic.subtitle}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>{readingTime} min read</span>
              <span className="hidden sm:inline text-border">·</span>
              <span>{topic.trust.coverageLabel}</span>
              <span className="hidden sm:inline text-border">·</span>
              <span>{topic.trust.confidenceLabel} confidence</span>
              {topic.updated_at && (
                <>
                  <span className="hidden sm:inline text-border">·</span>
                  <span>Updated {new Date(topic.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Reader layout: content + sticky ToC */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex gap-10 xl:gap-14">
          <main className="flex-1 min-w-0 max-w-[42rem]">
            {topic.content && parsed ? (
              <ArticleReaderBody
                slug={slug}
                content={topic.content}
                parsed={parsed}
                category={category?.slug ?? topic.category_slug ?? null}
              />
            ) : (
              <p className="text-muted-foreground">Content is being prepared for this topic.</p>
            )}

            <RelatedToolsSection
              lang={lang}
              topicSlug={slug}
              subcategorySlug={subcategory?.slug ?? null}
            />

            {faqs.length > 0 && (
              <section className="mt-16 pt-10 border-t border-border/40">
                <h2 className="text-lg font-bold text-foreground mb-6">Common questions</h2>
                <FaqSection questions={faqs} />
              </section>
            )}

            <ArticleFooter
              lang={lang}
              topicTitle={topic.title}
              citations={topic.citations}
              trust={topic.trust}
              entities={topic.entities}
              prerequisites={semanticRecommendations.prerequisites}
              nextTopics={semanticRecommendations.nextTopics}
              applications={semanticRecommendations.applications}
              connectedTopics={connectedTopics}
              learningPath={learningJourney.continueWith}
              sequentialNav={sequentialNav}
              recapPoints={parsed?.recapPoints ?? []}
              checkpoints={parsed?.checkpoints ?? []}
            />
          </main>

          {headings.length > 2 && (
            <aside className="hidden lg:block w-52 xl:w-60 shrink-0">
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
