import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getLatestArticles,
  getTrendingTopics,
  getCategoriesWithCounts,
  getPopularGuides,
  getHomepageStats,
  type HomepageStats,
} from "@/services/public/publicData";
import { Hero } from "@/components/public/Hero";
import { CategoryGrid } from "@/components/public/CategoryGrid";
import { TrendingToday } from "@/components/public/TrendingToday";
import { PopularGuides } from "@/components/public/PopularGuides";
import { LatestArticles } from "@/components/public/LatestArticles";
import { RecentlyUpdated } from "@/components/public/RecentlyUpdated";
import { WhyValendiro } from "@/components/public/WhyValendiro";

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
  const [latestArticles, trending, categories, guides, stats] = await Promise.all([
    getLatestArticles(12),
    getTrendingTopics(16),
    getCategoriesWithCounts(12),
    getPopularGuides(4),
    getHomepageStats(),
  ]);

  return (
    <div>
      <Hero lang={lang} stats={stats} />
      <CategoryGrid lang={lang} categories={categories} />
      {trending.length >= 4 && <TrendingToday lang={lang} topics={trending} />}
      {latestArticles.length >= 3 && <LatestArticles lang={lang} articles={latestArticles.slice(0, 6)} />}
      {guides.length >= 2 && <PopularGuides lang={lang} guides={guides} />}
      {latestArticles.length > 6 && <RecentlyUpdated lang={lang} articles={latestArticles.slice(6, 12)} />}
      <WhyValendiro />
    </div>
  );
}
