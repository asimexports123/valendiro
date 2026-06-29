import { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getFeaturedCollections, getLatestArticles } from "@/services/public/publicData";
import { LatestArticles } from "@/components/public/LatestArticles";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const collections = getFeaturedCollections();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) return {};
  return buildMetadata({
    title: `${collection.name} — Valendiro`,
    description: collection.description,
    canonical: `/${lang}/collections/${slug}`,
  });
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const collections = getFeaturedCollections();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) notFound();

  const articles = await getLatestArticles(6);

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: "Collections", href: `/${lang}/collections`, isCurrent: false },
    { name: collection.name, href: `/${lang}/collections/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: `${SITE_URL}/${lang}/collections/${slug}`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{collection.name}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{collection.description}</p>
      </div>
      <div className="mt-10">
        <LatestArticles lang={lang} articles={articles} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
