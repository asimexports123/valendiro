import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { PublicArticle } from "@/services/public/publicData";
import { MediaImage } from "./MediaImage";

export function LatestArticles({ lang, articles }: { lang: string; articles: PublicArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Latest Articles</h2>
            <p className="mt-2 text-muted-foreground">Freshly updated knowledge from our team.</p>
          </div>
          <Link href={`/${lang}/latest`} className="hidden sm:flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/${lang}/articles/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
            >
              <div className="relative h-40 w-full bg-muted">
                <MediaImage type="article" slug={article.slug} name={article.title} fill className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                  {article.description || "A trusted guide to the topic."}
                </p>
                <div className="mt-5 pt-5 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {article.reading_time} min read
                  </span>
                  <span>{article.updated_at ? new Date(article.updated_at).toLocaleDateString() : "Recently"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 sm:hidden">
          <Link href={`/${lang}/latest`} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
