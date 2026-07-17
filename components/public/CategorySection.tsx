/**
 * CategorySection - Phase 2 Editorial Redesign
 * 
 * Simple category grid for content discovery.
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
    <section className="py-12 border-b border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
        Categories
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/${lang}/categories/${category.slug}`}
            className="group p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
              {category.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
