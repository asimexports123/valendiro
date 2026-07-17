import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCategoryPageData } from "@/services/public/publicData";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";

// Phase 2: Optimized caching for category pages
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return {};
  const { category } = data;
  return buildMetadata({
    title: `${category.name} — Valendiro`,
    description: category.description || `Explore ${category.name} topics on Valendiro.`,
    canonical: `/${lang}/categories/${slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const pageData = await getCategoryPageData(slug);
  if (!pageData) notFound();

  const { category, subcategories, featuredTopics } = pageData;

  // Hide category pages with no published content
  const hasContent = subcategories.length > 0 || featuredTopics.length > 0;
  if (!hasContent) notFound();

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    { name: "Categories", href: `/${lang}/categories`, isCurrent: false },
    { name: category.name, href: `/${lang}/categories/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${SITE_URL}/${lang}/categories/${slug}`,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Category Header */}
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Breadcrumbs items={breadcrumbs} size="sm" separator="chevron" />
          
          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1]">
              {category.name}
            </h1>
            
            {category.description && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Category Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        
        {/* Subcategories */}
        {subcategories.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
              Subcategories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/${lang}/subcategories/${subcategory.slug}`}
                  className="group p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <h3 className="text-base font-medium text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    {subcategory.name}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Topics */}
        {featuredTopics.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
              Featured Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/${lang}/topics/${topic.slug}`}
                  className="group p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <h3 className="text-base font-medium text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors line-clamp-2">
                    {topic.title}
                  </h3>
                  {topic.subtitle && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {topic.subtitle}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
