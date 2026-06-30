import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCollectionBySlug, getTopicsByCollection, getArticlesByCollection, getCollectionsByCategory } from "@/services/public/publicData";
import { LatestArticles } from "@/components/public/LatestArticles";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EmptyState } from "@/components/public/EmptyState";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

async function getCategoryById(categoryId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("id", categoryId)
    .eq("category_translations.language_code", "en")
    .single();
  if (!data) return null;
  return { id: data.id, slug: data.slug, name: data.category_translations?.[0]?.name || "Category" };
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
    description: collection.description || `Explore the ${collection.name} collection on Valendiro.`,
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
    getTopicsByCollection(collection.id, 16),
    getArticlesByCollection(collection.id, 6),
    getCollectionsByCategory(collection.category_id, 6),
    collection.category_id ? getCategoryById(collection.category_id) : null,
  ]);

  const siblings = relatedCollections.filter((c) => c.slug !== slug);

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    ...(parentCategory
      ? [{ name: parentCategory.name, href: `/${lang}/categories/${parentCategory.slug}`, isCurrent: false }]
      : [{ name: "Collections", href: `/${lang}/collections`, isCurrent: false }]),
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
    <>
      {/* Hero */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-5">
            {parentCategory && (
              <Link
                href={`/${lang}/categories/${parentCategory.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-3"
              >
                ← {parentCategory.name}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
                {collection.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
              {articles.length > 0 && <><span>·</span><span>{articles.length} article{articles.length !== 1 ? "s" : ""}</span></>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">

        {/* Topics grid */}
        <section>
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">Topics in this collection</h2>
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topics.map((topic, i) => (
                <Link
                  key={topic.id}
                  href={`/${lang}/topics/${topic.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <span className="text-xs font-bold text-primary/50 mb-2">#{i + 1}</span>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug line-clamp-2">
                    {topic.title}
                  </h3>
                  {topic.subtitle && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{topic.subtitle}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📖"
              title="Topics coming soon"
              description="Topics for this collection are being prepared. Check back soon."
            />
          )}
        </section>

        {/* Articles */}
        {articles.length > 0 && <LatestArticles lang={lang} articles={articles} />}

        {/* Sibling collections */}
        {siblings.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-5">
              More collections in {parentCategory?.name ?? "this category"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {siblings.map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/collections/${c.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">{c.name}</h3>
                    {c.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                  </div>
                  <span className="text-muted-foreground group-hover:text-primary shrink-0">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
