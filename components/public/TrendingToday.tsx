import Link from "next/link";
import { PublicTopic } from "@/services/public/publicData";
import { CardThumbnail, CategoryBadge } from "@/components/public/CardVisual";

function estimateReadMins(subtitle: string | null): number {
  if (!subtitle) return 5;
  return Math.max(3, Math.min(15, Math.round(subtitle.split(/\s+/).length / 40) + 4));
}

export function TrendingToday({ lang, topics }: { lang: string; topics: PublicTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Trending Topics</h2>
            <p className="mt-1 text-sm text-muted-foreground">Most popular knowledge areas right now</p>
          </div>
          <Link href={`/${lang}/topics`} className="text-sm font-medium text-primary hover:text-primary/80 transition shrink-0">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Thumbnail */}
              <CardThumbnail
                categorySlug={topic.category_slug}
                title={topic.title}
                className="rounded-none"
              />

              {/* Body */}
              <div className="flex flex-col flex-1 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-primary/50 tabular-nums">#{i + 1}</span>
                  <CategoryBadge slug={topic.category_slug} />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug flex-1">
                  {topic.title}
                </h3>
                {topic.subtitle && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {topic.subtitle}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {estimateReadMins(topic.subtitle)} min read
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
