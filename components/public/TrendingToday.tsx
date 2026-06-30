import Link from "next/link";
import { PublicTopic } from "@/services/public/publicData";

export function TrendingToday({ lang, topics }: { lang: string; topics: PublicTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Trending Topics</h2>
          <Link href={`/${lang}/topics`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <span className="text-xs font-bold text-primary/60 mb-3">#{i + 1}</span>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                {topic.title}
              </h3>
              {topic.subtitle && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 flex-1 leading-relaxed">{topic.subtitle}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
