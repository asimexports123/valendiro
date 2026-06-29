import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getLatestArticles } from "@/services/public/publicData";
import { LatestArticles } from "@/components/public/LatestArticles";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Latest — Valendiro",
    description: "The latest articles and guides on Valendiro, the global knowledge platform.",
    canonical: `/${lang}/latest`,
  });
}

export default async function LatestPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const articles = await getLatestArticles(24);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Latest</h1>
        <p className="mt-3 text-muted-foreground">Freshly updated knowledge from our team.</p>
      </div>
      <LatestArticles lang={lang} articles={articles} />
    </div>
  );
}
