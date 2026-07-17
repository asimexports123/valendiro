/**
 * HomepageHero - Phase 2
 * 
 * Clean, premium hero section for the homepage.
 * Focus on editorial credibility and clear value proposition.
 */

import Link from "next/link";

export function HomepageHero({ lang }: { lang: string }) {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1]">
            Trusted Knowledge for Everything That Matters
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Expert articles, guides, and answers curated by our editorial team. 
            Clear, accurate, and continuously updated.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/${lang}/topics`}
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-slate-900 dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-50 focus:ring-offset-2"
            >
              Explore Topics
            </Link>
            <Link
              href={`/${lang}/categories`}
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-50 focus:ring-offset-2"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
