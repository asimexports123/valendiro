import Link from "next/link";
import { FeaturedTopicWithMeta } from "@/services/public/publicData";

export function FeaturedTopics({ lang, topics }: { lang: string; topics: FeaturedTopicWithMeta[] }) {
  if (topics.length === 0) return null;

  return (
    <section className="py-14 sm:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Featured Topics
          </h2>
          <p className="mt-2 text-muted-foreground">
            Most important topics across all categories
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/${lang}/topics/${topic.slug}`}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-snug line-clamp-2">
                {topic.title}
              </h3>

              <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                {topic.category_name && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                    {topic.category_name}
                  </span>
                )}
                {topic.subcategory_name && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
                    {topic.subcategory_name}
                  </span>
                )}
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between text-xs">
                {topic.article_count > 0 ? (
                  <span className="text-muted-foreground">
                    <strong className="text-foreground/80">{topic.article_count}</strong> article{topic.article_count !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">No articles yet</span>
                )}
                <span className="font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Read →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
