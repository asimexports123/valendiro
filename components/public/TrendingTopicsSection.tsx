/**
 * TrendingTopicsSection - Phase 2
 * 
 * Trending topics section for homepage.
 * Simple list design for quick discovery.
 */

import Link from "next/link";
import type { PublicTopic } from "@/services/public/publicData";

interface TrendingTopicsSectionProps {
  lang: string;
  topics: PublicTopic[];
}

export function TrendingTopicsSection({ lang, topics }: TrendingTopicsSectionProps) {
  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Trending Now
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Popular topics readers are exploring
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-3">
          {topics.map((topic, index) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all duration-200"
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 rounded-full">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                  {topic.title}
                </h3>
                {topic.category_slug && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {topic.category_slug}
                  </p>
                )}
              </div>
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0"
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
