import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicCollection } from "@/services/public/publicData";
import { MediaImage } from "./MediaImage";

export function FeaturedCollections({ lang, collections }: { lang: string; collections: PublicCollection[] }) {
  return (
    <section className="border-y border-border/60 bg-card py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Popular Collections</h2>
          <p className="mt-2 text-muted-foreground">Curated guides for deep learning.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/${lang}/collections/${collection.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-background overflow-hidden shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
            >
              <div className="relative h-36 w-full bg-muted">
                <MediaImage type="collection" slug={collection.slug} name={collection.name} fill className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {collection.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
