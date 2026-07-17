/**
 * HomepageHero - Phase 2 Editorial Redesign
 * 
 * Compact hero with value proposition and search for the new Valendiro editorial platform.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HomepageHero({ lang }: { lang: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1]">
            Clear answers for complex questions
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Practical guides and expert insights across technology, finance, health, and more.
          </p>
          
          <form onSubmit={handleSearch} className="mt-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, guides, and articles..."
                className="w-full px-5 py-4 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:border-transparent text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-500">Popular:</span>
            {["AI", "Investing", "Web Development", "Health"].map((term) => (
              <button
                key={term}
                onClick={() => router.push(`/${lang}/search?q=${encodeURIComponent(term)}`)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
