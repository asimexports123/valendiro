import Link from "next/link";
import { PublicArticle } from "@/services/public/publicData";
import { CardThumbnail, CategoryBadge } from "@/components/public/CardVisual";

function fmtDate(iso: string | null) {
  if (!iso) return "Recently updated";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function LatestArticles({ lang, articles }: { lang: string; articles: PublicArticle[] }) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Latest Guides</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fresh knowledge, regularly updated</p>
          </div>
          <Link href={`/${lang}/latest`} className="text-sm font-medium text-primary hover:text-primary/80 transition shrink-0">
            View all →
          </Link>
        </div>

        {/* Featured first article — spans full row on mobile, 2 cols on lg */}
        {featured && (
          <Link
            href={`/${lang}/articles/${featured.slug}`}
            className="group mb-4 flex flex-col sm:flex-row rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="sm:w-2/5 lg:w-1/3 shrink-0">
              <CardThumbnail categorySlug={featured.category_slug} title={featured.title} className="h-48 sm:h-full rounded-none" />
            </div>
            <div className="flex flex-col justify-center p-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge slug={featured.category_slug} />
                <span className="text-[10px] font-semibold text-primary bg-primary/8 rounded-full px-2 py-0.5 uppercase tracking-wide">Featured</span>
              </div>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-base leading-snug">
                {featured.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {featured.description || "An in-depth guide on this topic."}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  {featured.reading_time} min read
                </span>
                <span>{fmtDate(featured.updated_at)}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Remaining articles grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((article) => (
              <Link
                key={article.id}
                href={`/${lang}/articles/${article.slug}`}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <CardThumbnail categorySlug={article.category_slug} title={article.title} className="rounded-none" />
                <div className="flex flex-col flex-1 p-4">
                  <div className="mb-2">
                    <CategoryBadge slug={article.category_slug} />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug flex-1">
                    {article.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.description || "An in-depth guide on this topic."}
                  </p>
                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                      </svg>
                      {article.reading_time} min
                    </span>
                    <span className="ml-auto">{fmtDate(article.updated_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
