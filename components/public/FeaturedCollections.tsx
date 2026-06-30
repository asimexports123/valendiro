import Link from "next/link";
import { PublicCollection } from "@/services/public/publicData";
import { CollectionIcon, CategoryBadge } from "@/components/public/CardVisual";

export function FeaturedCollections({ lang, collections }: { lang: string; collections: PublicCollection[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="border-y border-border/50 bg-muted/30 py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Popular Collections</h2>
            <p className="mt-1 text-sm text-muted-foreground">Curated topic bundles — structured for deep learning</p>
          </div>
          <Link href={`/${lang}/collections`} className="text-sm font-medium text-primary hover:text-primary/80 transition shrink-0">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/${lang}/collections/${collection.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <CollectionIcon categorySlug={collection.category_slug} name={collection.name} />

              <div className="min-w-0 flex-1">
                <div className="mb-1.5">
                  <CategoryBadge slug={collection.category_slug} />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {collection.description}
                  </p>
                )}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  {collection.topic_count > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {collection.topic_count} topic{collection.topic_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  {collection.article_count > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                      {collection.article_count} article{collection.article_count !== 1 ? "s" : ""}
                    </span>
                  )}
                  <svg className="h-3.5 w-3.5 ml-auto text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
