/**
 * CategorySection - Phase 2 Editorial Redesign
 * 
 * Strong category discovery with visual hierarchy and polished cards.
 */

import Link from "next/link";
import type { PublicCategory } from "@/services/public/publicData";

interface CategorySectionProps {
  lang: string;
  categories: PublicCategory[];
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: "text-blue-600 dark:text-blue-400",
  "personal-finance": "text-emerald-600 dark:text-emerald-400",
  business: "text-violet-600 dark:text-violet-400",
  education: "text-amber-600 dark:text-amber-400",
  "health-wellness": "text-rose-600 dark:text-rose-400",
  "home-lifestyle": "text-orange-600 dark:text-orange-400",
  travel: "text-sky-600 dark:text-sky-400",
};

export function CategorySection({ lang, categories }: CategorySectionProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Explore by Category
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-10">
          Browse topics and guides across our main subject areas
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const colorClass = CATEGORY_COLORS[category.slug] || "text-slate-600 dark:text-slate-400";
            return (
              <Link
                key={category.id}
                href={`/${lang}/categories/${category.slug}`}
                className="group relative p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
