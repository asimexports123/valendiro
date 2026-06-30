import Link from "next/link";
import { PublicCollection } from "@/services/public/publicData";

export function FeaturedCollections({ lang, collections }: { lang: string; collections: PublicCollection[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="border-y border-border/50 bg-muted/30 py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Popular Collections</h2>
          <Link href={`/${lang}/collections`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/${lang}/collections/${collection.slug}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{collection.description}</p>
                )}
              </div>
              <svg className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
