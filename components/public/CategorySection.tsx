/**
 * CategorySection - Phase 2
 * 
 * Clean category grid for homepage.
 * Focus on discoverability and clear navigation.
 */

import Link from "next/link";
import type { PublicCategory } from "@/services/public/publicData";

interface CategorySectionProps {
  lang: string;
  categories: PublicCategory[];
}

export function CategorySection({ lang, categories }: CategorySectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Explore by Category
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Find expert knowledge across our main topics
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${lang}/categories/${category.slug}`}
              className="group relative p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    {category.name}
                  </h3>
                  {category.count !== undefined && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {category.count} topics
                    </p>
                  )}
                </div>
                <svg
                  className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
