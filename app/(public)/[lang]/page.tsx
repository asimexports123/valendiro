import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getLatestArticles,
  getCategoriesWithCounts,
  getPopularGuides,
  getFeaturedSubcategories,
  getTrendingTopics,
  getHomepageStats,
} from "@/services/public/publicData";
import { Hero } from "@/components/public/Hero";
import { CategoryGrid } from "@/components/public/CategoryGrid";
import { FeaturedSubcategories } from "@/components/public/FeaturedCollections";
import { PopularGuides } from "@/components/public/PopularGuides";
import { LatestArticles } from "@/components/public/LatestArticles";
import { RecentlyUpdated } from "@/components/public/RecentlyUpdated";
import { WhyValendiro } from "@/components/public/WhyValendiro";
import { TrendingTopics } from "@/components/public/TrendingTopics";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Valendiro — Trusted Knowledge for Everything That Matters",
    description:
      "Valendiro is a global knowledge platform. Discover millions of human-quality articles, guides and answers curated and updated by our editorial team.",
    canonical: `/${lang}`,
  });
}

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const [latestArticles, categories, guides, subcategories, trendingTopics, stats] = await Promise.all([
    getLatestArticles(12),
    getCategoriesWithCounts(12),
    getPopularGuides(4),
    getFeaturedSubcategories(6),
    getTrendingTopics(8),
    getHomepageStats(),
  ]);

  return (
    <div>
      <Hero lang={lang} stats={stats} />
      <CategoryGrid lang={lang} categories={categories} />
      <FeaturedSubcategories lang={lang} subcategories={subcategories} />
      <TrendingTopics lang={lang} topics={trendingTopics} />
      {latestArticles.length >= 3 && <LatestArticles lang={lang} articles={latestArticles.slice(0, 6)} />}
      {guides.length >= 2 && <PopularGuides lang={lang} guides={guides} />}
      {latestArticles.length > 6 && <RecentlyUpdated lang={lang} articles={latestArticles.slice(6, 12)} />}
      <WhyValendiro />
    </div>
  );
}
