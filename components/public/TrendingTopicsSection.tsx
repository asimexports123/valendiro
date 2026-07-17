/**
 * TrendingTopicsSection - Phase 2 Editorial Redesign
 * 
 * Simple topic list for content discovery.
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
    <section className="py-12">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-8">
        Trending Topics
      </h2>
      <div className="space-y-3">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/${lang}/topics/${topic.slug}`}
            className="block p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-50 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              {topic.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
