/**
 * FeaturedTopicsSection - Phase 2 Editorial Redesign
 * 
 * Simple topic list for content discovery.
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
    <section className="py-12 border-b border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
        Featured Topics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
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
  );
}
