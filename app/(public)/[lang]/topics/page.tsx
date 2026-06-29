import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getTrendingTopics } from "@/services/public/publicData";
import { TrendingToday } from "@/components/public/TrendingToday";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Topics — Valendiro",
    description: "Browse topics across every domain of knowledge on Valendiro.",
    canonical: `/${lang}/topics`,
  });
}

export default async function TopicsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const topics = await getTrendingTopics(30);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Topics</h1>
        <p className="mt-3 text-muted-foreground">Browse topics across every domain of knowledge.</p>
      </div>
      <TrendingToday lang={lang} topics={topics} />
    </div>
  );
}
