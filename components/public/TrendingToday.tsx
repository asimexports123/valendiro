import Link from "next/link";
import { PublicTopic } from "@/services/public/publicData";
import { MediaImage } from "./MediaImage";

export function TrendingToday({ lang, topics }: { lang: string; topics: PublicTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Trending Topics</h2>
          <Link href={`/${lang}/latest`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
            View latest →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
            >
              <div className="relative h-32 w-full bg-muted">
                <MediaImage type="topic" slug={topic.slug} name={topic.title} fill className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {topic.title}
                </h3>
                {topic.subtitle && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">{topic.subtitle}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
