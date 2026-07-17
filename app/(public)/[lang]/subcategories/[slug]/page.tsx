import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getSubcategoryBySlug,
  getTopicsBySubcategorySimple,
  getArticlesBySubcategory,
  getActiveRelatedSubcategories,
  SubcategoryDifficulty,
} from "@/services/public/publicData";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { isActiveSubcategorySlug } from "@/config/activeTaxonomy";
import { SITE_URL } from "@/lib/constants";

// Phase 2: Optimized caching for subcategory pages
export const revalidate = 3600;
export const dynamicParams = true;

const DIFFICULTY_CONFIG: Record<SubcategoryDifficulty, { label: string; color: string }> = {
  Beginner: { label: "Beginner", color: "text-emerald-600 dark:text-emerald-400" },
  Intermediate: { label: "Intermediate", color: "text-amber-600 dark:text-amber-400" },
  Advanced: { label: "Advanced", color: "text-rose-600 dark:text-rose-400" },
};

async function getCategoryById(categoryId: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, category_translations(name)")
    .eq("id", categoryId)
    .eq("category_translations.language_code", "en")
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, slug: data.slug, name: (data.category_translations as any)?.[0]?.name || "Category" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const subcategory = await getSubcategoryBySlug(slug);
  if (!subcategory) return {};
  return buildMetadata({
    title: `${subcategory.name} — Valendiro`,
    description: subcategory.description || `Explore ${subcategory.name} topics on Valendiro.`,
    canonical: `/${lang}/subcategories/${slug}`,
  });
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const subcategory = await getSubcategoryBySlug(slug);
  if (!subcategory) notFound();

  const parentCategory = subcategory.category_id
    ? await getCategoryById(subcategory.category_id)
    : null;

  const [topics, articles, relatedSubcategories] = await Promise.all([
    getTopicsBySubcategorySimple(subcategory.id, 12),
    getArticlesBySubcategory(subcategory.id, 6),
    parentCategory?.slug
      ? getActiveRelatedSubcategories(parentCategory.slug, slug, 4)
      : Promise.resolve([]),
  ]);

  // 404 only when empty and not an active branch
  if (topics.length === 0 && !isActiveSubcategorySlug(slug)) {
    notFound();
  }

  const diff = DIFFICULTY_CONFIG[subcategory.difficulty];
  const siblings = relatedSubcategories.slice(0, 4);

  const breadcrumbs = [
    { name: "Home", href: `/${lang}`, isCurrent: false },
    ...(parentCategory
      ? [{ name: parentCategory.name, href: `/${lang}/categories/${parentCategory.slug}`, isCurrent: false }]
      : []),
    { name: subcategory.name, href: `/${lang}/subcategories/${slug}`, isCurrent: true },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: subcategory.name,
    description: subcategory.description,
    url: `${SITE_URL}/${lang}/subcategories/${slug}`,
    numberOfItems: topics.length,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Subcategory Header */}
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Breadcrumbs items={breadcrumbs} size="sm" separator="chevron" />
          
          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1]">
              {subcategory.name}
            </h1>
            
            {subcategory.description && (
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {subcategory.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Subcategory Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        
        {/* Topics */}
        {topics.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
              Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/${lang}/topics/${topic.slug}`}
                  className="group p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
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

        {/* Related Subcategories */}
        {siblings.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
              Related Subcategories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.id}
                  href={`/${lang}/subcategories/${sibling.slug}`}
                  className="group p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <h3 className="text-base font-medium text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors line-clamp-2">
                    {sibling.name}
                  </h3>
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
