import { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts, getTopicsByCategory } from "@/services/public/publicData";
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
    title: "All Topics — Valendiro",
    description: "Browse all knowledge topics across technology, finance, health, education and more.",
    canonical: `/${lang}/topics`,
  });
}

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const categories = await getCategoriesWithCounts(10);

  const topicsPerCategory = await Promise.all(
    categories.map(async (cat) => ({
      category: cat,
      topics: await getTopicsByCategory(cat.id, 8),
    }))
  );
  const grouped = topicsPerCategory.filter((g) => g.topics.length > 0);

  return (
    <>
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">All Topics</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            In-depth topics organised by category. Each topic contains curated articles, guides, and answers.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {grouped.length === 0 ? (
          <EmptyState
            emoji="📚"
            title="Topics coming soon"
            description="We are adding topics across every category. Check back soon."
            action={{ label: "Browse Categories", href: `/${lang}/categories` }}
          />
        ) : (
          <div className="space-y-14">
            {grouped.map(({ category, topics }) => (
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
                    <span className="text-sm text-muted-foreground">({topics.length})</span>
                  </div>
                  <Link href={`/${lang}/categories/${category.slug}`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
                    View all →
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
            ))}
          </div>
        )}
      </div>
    </>
  );
}
