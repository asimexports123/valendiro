import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { LatestArticles } from "@/components/public/LatestArticles";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Articles — Valendiro",
    description: "Long-form guides, explainers, and reference articles on Valendiro.",
    canonical: `/${lang}/articles`,
  });
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const { getLatestArticles } = await import("@/services/public/publicData");
  const articles = await getLatestArticles(24);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Articles</h1>
        <p className="mt-3 text-muted-foreground">Long-form guides, explainers, and reference articles.</p>
      </div>
      <LatestArticles lang={lang} articles={articles} />
    </div>
  );
}
