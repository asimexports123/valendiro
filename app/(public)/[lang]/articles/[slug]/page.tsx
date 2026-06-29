import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getArticleBySlug, getRelatedArticles, extractHeadings, getQuestionsByCategory } from "@/services/public/publicData";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { LatestArticles } from "@/components/public/LatestArticles";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import { Clock, Calendar } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600;

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
    getRelatedArticles(article.id, article.topic_id, article.category_id, 3),
    article.category_id ? getCategoryBySlugForArticle(article.category_id) : null,
    article.collection_id ? getCollectionBySlugForArticle(article.collection_id) : null,
    article.topic_id ? getTopicBySlugForArticle(article.topic_id) : null,
    article.category_id ? getQuestionsByCategory(article.category_id, 5) : Promise.resolve([]),
  ]);

  const headings = extractHeadings(article.content);

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: category?.name || "Articles", href: category ? `/${lang}/categories/${category.slug}` : `/${lang}/articles`, isCurrent: false },
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <article className="lg:col-span-8">
          <header className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">{article.title}</h1>
            {article.excerpt && (
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {article.reading_time} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Updated {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : "recently"}
              </span>
            </div>
          </header>

          {headings.length > 0 && (
            <nav aria-label="Table of contents" className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">On this page</h2>
              <ol className="mt-4 space-y-2">
                {headings.map((heading) => (
                  <li key={heading.id} className={heading.level === 3 ? "pl-4" : ""}>
                    <Link href={`#${heading.id}`} className="text-sm text-muted-foreground hover:text-accent transition">
                      {heading.text}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {article.content && (
            <div className="mt-10 max-w-3xl prose-headings:scroll-mt-24">
              <MarkdownContent content={article.content} />
            </div>
          )}
        </article>

        <aside className="lg:col-span-4 space-y-8">
          {relatedArticles.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow)]">
              <h2 className="text-lg font-semibold text-foreground mb-4">Related Articles</h2>
              <ul className="space-y-4">
                {relatedArticles.map((item) => (
                  <li key={item.id}>
                    <Link href={`/${lang}/articles/${item.slug}`} className="group block">
                      <span className="font-medium text-foreground group-hover:text-accent transition-colors">{item.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.reading_time} min read</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(topic || collection) && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow)]">
              <h2 className="text-lg font-semibold text-foreground mb-4">Knowledge hub</h2>
              <ul className="space-y-3">
                {topic && (
                  <li>
                    <Link href={`/${lang}/topics/${topic.slug}`} className="text-sm text-muted-foreground hover:text-accent transition">
                      Topic: {topic.title}
                    </Link>
                  </li>
                )}
                {collection && (
                  <li>
                    <Link href={`/${lang}/collections/${collection.slug}`} className="text-sm text-muted-foreground hover:text-accent transition">
                      Collection: {collection.name}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <FaqSection questions={faqs} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}

async function getCategoryBySlugForArticle(categoryId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("id", categoryId)
    .eq("category_translations.language_code", "en")
    .single();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.category_translations?.[0]?.name || "Category",
  };
}

async function getCollectionBySlugForArticle(collectionId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("id, slug, collection_translations(name)")
    .eq("id", collectionId)
    .eq("collection_translations.language_code", "en")
    .single();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.collection_translations?.[0]?.name || "Collection",
  };
}

async function getTopicBySlugForArticle(topicId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .single();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    title: data.topic_translations?.[0]?.title || "Topic",
  };
}
