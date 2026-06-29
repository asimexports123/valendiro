import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryBySlug, getTopicsByCategory, getArticlesByCategory, getRelatedCategories, getCollectionsByCategory, getQuestionsByCategory } from "@/services/public/publicData";
import { TrendingToday } from "@/components/public/TrendingToday";
import { LatestArticles } from "@/components/public/LatestArticles";
import { FeaturedCollections } from "@/components/public/FeaturedCollections";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildMetadata({
    title: `${category.name} — Valendiro`,
    description: category.description || `Explore ${category.name} articles, guides, and answers on Valendiro.`,
    canonical: `/${lang}/categories/${slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [topics, articles, relatedCategories, collections, faqs] = await Promise.all([
    getTopicsByCategory(category.id, 12),
    getArticlesByCategory(category.id, 6),
    getRelatedCategories(category.id, 4),
    getCollectionsByCategory(category.id, 6),
    getQuestionsByCategory(category.id, 5),
  ]);

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: "Categories", href: `/${lang}/categories`, isCurrent: false },
    { name: category.name, href: `/${lang}/categories/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${SITE_URL}/${lang}/categories/${slug}`,
    isPartOf: { "@id": `${SITE_URL}/${lang}` },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{category.name}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {category.description || `A complete knowledge hub for ${category.name.toLowerCase()}. Explore guides, topics, and answers curated by Valendiro.`}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {category.article_count} topic{category.article_count === 1 ? "" : "s"} in this category
        </p>
      </div>

      {topics.length > 0 && (
        <div className="mt-16">
          <TrendingToday lang={lang} topics={topics} />
        </div>
      )}

      {articles.length > 0 && (
        <div className="mt-8">
          <LatestArticles lang={lang} articles={articles} />
        </div>
      )}

      {relatedCategories.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Related Categories</h2>
          <div className="flex flex-wrap gap-3">
            {relatedCategories.map((cat) => (
              <a
                key={cat.id}
                href={`/${lang}/categories/${cat.slug}`}
                className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/30 transition"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <FeaturedCollections lang={lang} collections={collections} />
      </section>

      <FaqSection questions={faqs} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
