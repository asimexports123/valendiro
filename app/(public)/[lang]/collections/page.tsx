import { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts, getCollectionsByCategory } from "@/services/public/publicData";
import { EmptyState } from "@/components/public/EmptyState";

export const revalidate = 86400;

const CATEGORY_EMOJIS: Record<string, string> = {
  technology: "💻", "personal-finance": "💰", business: "📈",
  education: "🎓", "health-wellness": "🌿", "home-lifestyle": "🏠", travel: "✈️",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Collections — Valendiro",
    description: "Browse curated knowledge collections organised by category on Valendiro.",
    canonical: `/${lang}/collections`,
  });
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const categories = await getCategoriesWithCounts(10);

  const collectionsPerCategory = await Promise.all(
    categories.map(async (cat) => ({
      category: cat,
      collections: await getCollectionsByCategory(cat.id, 8),
    }))
  );
  const grouped = collectionsPerCategory.filter((g) => g.collections.length > 0);
  const totalCollections = grouped.reduce((sum, g) => sum + g.collections.length, 0);

  return (
    <>
      {/* Hero */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Collections</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Curated, focused sub-topics organised under each knowledge category. Think of collections as subcategories — structured paths through a subject.
          </p>
          {totalCollections > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{totalCollections} collection{totalCollections !== 1 ? "s" : ""} across {grouped.length} categories</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {grouped.length === 0 ? (
          <EmptyState
            emoji="📚"
            title="Collections coming soon"
            description="We are building curated collections. Check back soon or explore categories."
            action={{ label: "Browse Categories", href: `/${lang}/categories` }}
          />
        ) : (
          <div className="space-y-14">
            {grouped.map(({ category, collections }) => (
              <section key={category.id}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_EMOJIS[category.slug] ?? "📚"}</span>
                    <Link
                      href={`/${lang}/categories/${category.slug}`}
                      className="text-lg font-bold text-foreground hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">({collections.length})</span>
                  </div>
                  <Link
                    href={`/${lang}/categories/${category.slug}`}
                    className="text-sm font-medium text-accent hover:text-accent/80 transition"
                  >
                    View category →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {collections.map((col) => (
                    <Link
                      key={col.id}
                      href={`/${lang}/collections/${col.slug}`}
                      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                    >
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug">
                        {col.name}
                      </h3>
                      {col.description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{col.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
