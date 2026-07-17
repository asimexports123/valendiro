import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildArticleMetadata, buildBreadcrumbMetadata } from "@/lib/seo/metadata";
import {
  getTopicBySlug,
  getQuestionsByTopic,
  getSequentialNavigation,
  getTopicsBySubcategorySimple,
} from "@/services/public/publicData";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { parseArticleContent, extractHeadings, estimateReadingTime } from "@/lib/reader/contentParser";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";

// Phase 2: Optimized caching for editorial content
export const revalidate = 3600;
export const dynamicParams = true;
export const dynamic = "auto";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return {};
  
  const category = topic.category_id ? await getCategoryBySlugFromId(topic.category_id) : null;
  
  return buildArticleMetadata({
    title: `${topic.title} — Valendiro`,
    description: topic.meta_description || topic.subtitle || `Learn about ${topic.title} on Valendiro.`,
    canonical: `/${lang}/topics/${slug}`,
    headline: topic.title,
    datePublished: topic.updated_at ?? undefined,
    dateModified: topic.updated_at ?? undefined,
    authorName: "Valendiro Editorial",
    section: category?.name ?? undefined,
  });
}

export default async function TopicPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  // Phase 2: Simplified data fetching for clean editorial experience
  const [faqs, sequentialNav, relatedTopics] =
    await Promise.all([
      getQuestionsByTopic(topic.id, 5),
      topic.category_id ? getSequentialNavigation(topic.id, topic.category_id) : null,
      topic.subcategory_id ? getTopicsBySubcategorySimple(topic.subcategory_id, 4) : [],
    ]);

  const category = topic.category_id ? await getCategoryBySlugFromId(topic.category_id) : null;
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
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Article Header */}
      <article className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Breadcrumbs items={breadcrumbs} size="sm" separator="chevron" />
          
          <div className="mt-6 max-w-3xl">
            {category && (
              <Link
                href={`/${lang}/categories/${category.slug}`}
                className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4 transition-colors"
              >
                {category.name}
              </Link>
            )}
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1]">
              {topic.title}
            </h1>
            
            {topic.subtitle && (
              <p className="mt-4 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                {topic.subtitle}
              </p>
            )}
            
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>{readingTime} min read</span>
              {topic.updated_at && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span>Updated {new Date(topic.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
          {topic.content && parsed ? (
            <div dangerouslySetInnerHTML={{ __html: parsed.html }} />
          ) : (
            <p className="text-slate-600 dark:text-slate-400">Content is being prepared for this topic.</p>
          )}
        </div>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8">Common Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-900 dark:text-slate-50">
                    {faq.question}
                    <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8">Related Topics</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedTopics.filter(t => t.id !== topic.id).slice(0, 4).map((relatedTopic) => (
                <Link
                  key={relatedTopic.id}
                  href={`/${lang}/topics/${relatedTopic.slug}`}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <h3 className="font-medium text-slate-900 dark:text-slate-50 line-clamp-2">
                    {relatedTopic.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sequential Navigation */}
        {sequentialNav && (sequentialNav.previous || sequentialNav.next) && (
          <nav className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="grid sm:grid-cols-2 gap-4">
              {sequentialNav.previous && (
                <Link
                  href={`/${lang}/topics/${sequentialNav.previous.slug}`}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Previous</div>
                  <div className="font-medium text-slate-900 dark:text-slate-50 line-clamp-2">
                    {sequentialNav.previous.title}
                  </div>
                </Link>
              )}
              {sequentialNav.next && (
                <Link
                  href={`/${lang}/topics/${sequentialNav.next.slug}`}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors sm:ml-auto"
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Next</div>
                  <div className="font-medium text-slate-900 dark:text-slate-50 line-clamp-2">
                    {sequentialNav.next.title}
                  </div>
                </Link>
              )}
            </div>
          </nav>
        )}
      </article>

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
