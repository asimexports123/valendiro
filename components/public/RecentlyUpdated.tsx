import Link from "next/link";
import { Clock } from "lucide-react";
import { PublicArticle } from "@/services/public/publicData";
import { MediaImage } from "./MediaImage";

function timeAgo(date: string | null): string {
  if (!date) return "Recently";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function RecentlyUpdated({ lang, articles }: { lang: string; articles: PublicArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="border-y border-border/60 bg-card py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Recently Updated</h2>
          <p className="mt-2 text-muted-foreground">Fresh, continuously improved knowledge.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/${lang}/articles/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-background overflow-hidden shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
            >
              <div className="relative h-28 w-full bg-muted">
                <MediaImage type="article" slug={article.slug} name={article.title} fill className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
                  {article.description || "A trusted guide."}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Updated {timeAgo(article.updated_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
