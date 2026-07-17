/**
 * FeaturedTopicsSection - Phase 2
 * 
 * Featured topics section for homepage.
 * Clean card design focused on content discovery.
 */

import Link from "next/link";
import type { PublicTopic } from "@/services/public/publicData";

interface FeaturedTopicsSectionProps {
  lang: string;
  topics: PublicTopic[];
}

export function FeaturedTopicsSection({ lang, topics }: FeaturedTopicsSectionProps) {
  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Featured Topics
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Hand-picked guides and articles from our editorial team
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  {topic.category_slug && (
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {topic.category_slug}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors line-clamp-2">
                  {topic.title}
                </h3>
                {topic.subtitle && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {topic.subtitle}
                  </p>
                )}
              </div>
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-500">
                  <span className="group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    Read more →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
