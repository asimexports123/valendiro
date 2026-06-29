import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getTopicBySlug, getRelatedTopics, getArticlesByTopic, getQuestionsByTopic } from "@/services/public/publicData";
import { MarkdownContent } from "@/components/public/MarkdownContent";
import { TrendingToday } from "@/components/public/TrendingToday";
import { LatestArticles } from "@/components/public/LatestArticles";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return {};
  return buildMetadata({
    title: `${topic.title} — Valendiro`,
    description: topic.meta_description || topic.subtitle || `Learn about ${topic.title} on Valendiro.`,
    canonical: `/${lang}/topics/${slug}`,
  });
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const [relatedTopics, relatedArticles, faqs, collection] = await Promise.all([
    getRelatedTopics(topic.id, topic.category_id, 6),
    getArticlesByTopic(topic.id, 6),
    getQuestionsByTopic(topic.id, 5),
    topic.collection_id ? getCollectionBySlugFromId(topic.collection_id) : null,
  ]);

  const category = topic.category_id ? await getCategoryBySlugFromId(topic.category_id) : null;

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: category?.name || "Topics", href: category ? `/${lang}/categories/${category.slug}` : `/${lang}/topics`, isCurrent: false },
    { name: topic.title, href: `/${lang}/topics/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.subtitle || topic.meta_description,
    url: `${SITE_URL}/${lang}/topics/${slug}`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{topic.title}</h1>
        {topic.subtitle && <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{topic.subtitle}</p>}
      </div>

      {topic.content && (
        <div className="mt-10 max-w-3xl">
          <MarkdownContent content={topic.content} />
        </div>
      )}

      {collection && (
        <div className="mt-8 max-w-3xl">
          <Link
            href={`/${lang}/collections/${collection.slug}`}
            className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition"
          >
            Part of {collection.name}
          </Link>
        </div>
      )}

      {relatedArticles.length > 0 && (
        <div className="mt-16">
          <LatestArticles lang={lang} articles={relatedArticles} />
        </div>
      )}

      {relatedTopics.length > 0 && (
        <div className="mt-8">
          <TrendingToday lang={lang} topics={relatedTopics} />
        </div>
      )}

      <FaqSection questions={faqs} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}

async function getCategoryBySlugFromId(categoryId: string) {
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

async function getCollectionBySlugFromId(collectionId: string) {
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
