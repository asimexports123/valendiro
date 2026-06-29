import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCollectionBySlug, getTopicsByCollection, getArticlesByCollection, getCollectionsByCategory } from "@/services/public/publicData";
import { LatestArticles } from "@/components/public/LatestArticles";
import { TrendingToday } from "@/components/public/TrendingToday";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

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
    description: collection.description,
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

  const [topics, articles, relatedCollections] = await Promise.all([
    getTopicsByCollection(collection.id, 12),
    getArticlesByCollection(collection.id, 6),
    getCollectionsByCategory(collection.category_id, 6),
  ]);

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: "Collections", href: `/${lang}/collections`, isCurrent: false },
    { name: collection.name, href: `/${lang}/collections/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: `${SITE_URL}/${lang}/collections/${slug}`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{collection.name}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{collection.description}</p>
      </div>

      {topics.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Topics in this collection</h2>
          <TrendingToday lang={lang} topics={topics} />
        </div>
      )}

      {articles.length > 0 && (
        <div className="mt-12">
          <LatestArticles lang={lang} articles={articles} />
        </div>
      )}

      {relatedCollections.filter((c) => c.slug !== slug).length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-foreground mb-4">Related collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedCollections
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/${lang}/collections/${c.slug}`}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                </Link>
              ))}
          </div>
        </div>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
