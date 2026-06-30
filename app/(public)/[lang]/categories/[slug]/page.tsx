import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryBySlug, getTopicsByCategory, getCollectionsByCategory, getQuestionsByCategory, getCategoriesWithCounts } from "@/services/public/publicData";
import { FaqSection } from "@/components/public/FaqSection";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EmptyState } from "@/components/public/EmptyState";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  technology:       { bg: "bg-blue-50 dark:bg-blue-950/30",    text: "text-blue-700 dark:text-blue-300",   border: "border-blue-200 dark:border-blue-800",   emoji: "💻" },
  "personal-finance": { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", emoji: "💰" },
  business:         { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", emoji: "📈" },
  education:        { bg: "bg-amber-50 dark:bg-amber-950/30",   text: "text-amber-700 dark:text-amber-300",  border: "border-amber-200 dark:border-amber-800",  emoji: "🎓" },
  "health-wellness":{ bg: "bg-rose-50 dark:bg-rose-950/30",     text: "text-rose-700 dark:text-rose-300",    border: "border-rose-200 dark:border-rose-800",    emoji: "🌿" },
  "home-lifestyle": { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", emoji: "🏠" },
  travel:           { bg: "bg-sky-50 dark:bg-sky-950/30",       text: "text-sky-700 dark:text-sky-300",      border: "border-sky-200 dark:border-sky-800",      emoji: "✈️" },
};

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
    description: category.description || `Explore ${category.name} guides, collections, and topics on Valendiro.`,
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

  const [topics, collections, faqs, allCategories] = await Promise.all([
    getTopicsByCategory(category.id, 12),
    getCollectionsByCategory(category.id, 12),
    getQuestionsByCategory(category.id, 6),
    getCategoriesWithCounts(10),
  ]);

  const accent = CATEGORY_ACCENTS[slug] ?? { bg: "bg-muted/40", text: "text-foreground", border: "border-border", emoji: "📚" };
  const otherCategories = allCategories.filter((c) => c.slug !== slug);

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
  };

  return (
    <>
      {/* Hero banner */}
      <div className={`border-b ${accent.border} ${accent.bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Breadcrumbs items={breadcrumbs} />
          <div className="mt-5 flex items-start gap-4">
            <span className="text-4xl shrink-0">{accent.emoji}</span>
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${accent.text}`}>
                {category.name}
              </h1>
              <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
                {category.description || `A complete knowledge hub for ${category.name.toLowerCase()}. Explore curated collections, in-depth topics, and expert guides.`}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{collections.length} collection{collections.length !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">

        {/* Collections = Subcategories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Collections</h2>
              <p className="mt-1 text-sm text-muted-foreground">Focused sub-topics within {category.name}</p>
            </div>
          </div>
          {collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/${lang}/collections/${col.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${accent.bg}`}>
                    {accent.emoji}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {col.name}
                    </h3>
                    {col.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{col.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji={accent.emoji}
              title="Collections coming soon"
              description="We are building curated collections for this category. Check back soon."
            />
          )}
        </section>

        {/* Topics */}
        {topics.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Topics</h2>
              <Link href={`/${lang}/topics`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
                All topics →
              </Link>
            </div>
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
          </section>
        )}

        {/* FAQ */}
        {faqs.length > 0 && <FaqSection questions={faqs} />}

        {/* Other Categories */}
        {otherCategories.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Explore other categories</h2>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${lang}/categories/${cat.slug}`}
                  className="inline-flex items-center rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
                >
                  {cat.name}
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
