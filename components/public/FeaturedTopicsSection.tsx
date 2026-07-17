/**
 * FeaturedTopicsSection - Phase 2 Editorial Redesign
 * 
 * Editorial featured-content section with primary story and supporting content.
 */

import Link from "next/link";
import type { FeaturedTopicWithMeta } from "@/services/public/publicData";

interface FeaturedTopicsSectionProps {
  lang: string;
  topics: FeaturedTopicWithMeta[];
}

export function FeaturedTopicsSection({ lang, topics }: FeaturedTopicsSectionProps) {
  if (!topics || topics.length === 0) {
    return null;
  }

  const primaryTopic = topics[0];
  const supportingTopics = topics.slice(1, 5);

  return (
    <section className="py-16 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Featured
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-10">
          Essential guides and insights
        </p>
        
        {/* Primary Featured Story */}
        {primaryTopic && (
          <Link
            href={`/${lang}/topics/${primaryTopic.slug}`}
            className="group block mb-10"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="p-8">
                {primaryTopic.category_name && (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full mb-4">
                    {primaryTopic.category_name}
                  </span>
                )}
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {primaryTopic.title}
                </h3>
                {primaryTopic.subtitle && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 line-clamp-2">
                    {primaryTopic.subtitle}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Supporting Stories Grid */}
        {supportingTopics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportingTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/${lang}/topics/${topic.slug}`}
                className="group"
              >
                <div className="h-full p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300">
                  {topic.category_name && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded mb-3">
                      {topic.category_name}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {topic.title}
                  </h3>
                  {topic.subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {topic.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
