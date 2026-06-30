import Link from "next/link";
import { PublicArticle } from "@/services/public/publicData";

export function LatestArticles({ lang, articles }: { lang: string; articles: PublicArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Latest Guides</h2>
          <Link href={`/${lang}/latest`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/${lang}/articles/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                <p className="mt-2.5 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {article.description || "An in-depth guide on this topic."}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium">
                  {article.reading_time} min read
                </span>
                <span>{article.updated_at ? new Date(article.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
