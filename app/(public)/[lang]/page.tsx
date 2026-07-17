import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getCategoriesWithCounts,
  getTrendingTopics,
  getFeaturedTopicsWithMeta,
} from "@/services/public/publicData";
import { HomepageHero } from "@/components/public/HomepageHero";
import { CategorySection } from "@/components/public/CategorySection";
import { FeaturedTopicsSection } from "@/components/public/FeaturedTopicsSection";
import { TrendingTopicsSection } from "@/components/public/TrendingTopicsSection";

// Phase 2: Increased revalidate for better performance
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Valendiro",
    description: "Expert articles and guides across technology, finance, health, and more.",
    canonical: `/${lang}`,
  });
}

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const [categories, trendingTopics, featuredTopics] = await Promise.all([
    getCategoriesWithCounts(12),
    getTrendingTopics(6),
    getFeaturedTopicsWithMeta(6),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <HomepageHero lang={lang} />
      <CategorySection lang={lang} categories={categories} />
      <FeaturedTopicsSection lang={lang} topics={featuredTopics} />
      <TrendingTopicsSection lang={lang} topics={trendingTopics} />
    </div>
  );
}
