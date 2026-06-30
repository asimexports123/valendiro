import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts } from "@/services/public/publicData";
import { CategoryGrid } from "@/components/public/CategoryGrid";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "All Categories — Valendiro",
    description: "Browse all knowledge categories on Valendiro — technology, finance, health, education, travel and more.",
    canonical: `/${lang}/categories`,
  });
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const categories = await getCategoriesWithCounts(24);

  return (
    <>
      {/* Hero */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Explore by Category
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Every subject you care about — organised, structured, and ready to explore. Pick a category to dive in.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <CategoryGrid lang={lang} categories={categories} />
      </div>
    </>
  );
}
