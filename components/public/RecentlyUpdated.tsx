import Link from "next/link";
import { PublicArticle } from "@/services/public/publicData";

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
    <section className="py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Recently Updated</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/${lang}/articles/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                {article.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                {article.description || "A trusted guide."}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Updated {timeAgo(article.updated_at)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
