import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts } from "@/services/public/publicData";
import { CategoryGrid } from "@/components/public/CategoryGrid";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Categories — Valendiro",
    description: "Browse knowledge categories on Valendiro, the global knowledge platform.",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Categories</h1>
        <p className="mt-3 text-muted-foreground">Explore trusted knowledge organized by topic.</p>
      </div>
      <CategoryGrid lang={lang} categories={categories} />
    </div>
  );
}
