import Link from "next/link";
import { PublicArticle } from "@/services/public/publicData";
import { CollectionIcon, CategoryBadge } from "@/components/public/CardVisual";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PopularGuides({ lang, guides }: { lang: string; guides: PublicArticle[] }) {
  if (guides.length === 0) return null;

  return (
    <section className="py-14 sm:py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Featured Guides</h2>
            <p className="mt-1 text-sm text-muted-foreground">Editor-picked guides worth reading today</p>
          </div>
          <Link href={`/${lang}/articles`} className="text-sm font-medium text-primary hover:text-primary/80 transition shrink-0">
            Browse all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/${lang}/articles/${guide.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <CollectionIcon categorySlug={guide.category_slug} name={guide.title} size={44} />
              <div className="flex-1 min-w-0">
                <div className="mb-1.5">
                  <CategoryBadge slug={guide.category_slug} />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                  {guide.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {guide.description || "A comprehensive guide."}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {guide.reading_time} min read
                  </span>
                  {fmtDate(guide.updated_at) && (
                    <span className="ml-auto">{fmtDate(guide.updated_at)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
