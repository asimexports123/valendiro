import Link from "next/link";
import { PublicTopic } from "@/services/public/publicData";

export function TrendingTopics({ lang, topics }: { lang: string; topics: PublicTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="py-14 sm:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Trending Topics
            </h2>
            <p className="mt-2 text-muted-foreground">
              Most explored topics right now
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group relative inline-flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-3 hover:border-primary/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {topic.title}
              </span>
              <svg
                className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
