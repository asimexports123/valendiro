import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getFeaturedCollections } from "@/services/public/publicData";
import { FeaturedCollections } from "@/components/public/FeaturedCollections";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return buildMetadata({
    title: "Collections — Valendiro",
    description: "Curated knowledge collections on Valendiro, the global knowledge platform.",
    canonical: `/${lang}/collections`,
  });
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const collections = getFeaturedCollections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Collections</h1>
        <p className="mt-3 text-muted-foreground">Curated guides for deep learning.</p>
      </div>
      <FeaturedCollections lang={lang} collections={collections} />
    </div>
  );
}
