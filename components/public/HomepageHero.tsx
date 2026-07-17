/**
 * HomepageHero - Phase 2 Editorial Redesign
 * 
 * Simple, clean hero for the new Valendiro editorial platform.
 * Focus on content discovery without marketing language.
 */

import Link from "next/link";

export function HomepageHero({ lang }: { lang: string }) {
  return (
    <section className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
            Valendiro
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Expert articles and guides across technology, finance, health, and more.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/topics`}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-slate-50 dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Browse Topics
            </Link>
            <Link
              href={`/${lang}/categories`}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Explore Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
