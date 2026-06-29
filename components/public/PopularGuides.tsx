import Link from "next/link";
import { Clock } from "lucide-react";
import { PublicArticle } from "@/services/public/publicData";
import { MediaImage } from "./MediaImage";

export function PopularGuides({ lang, guides }: { lang: string; guides: PublicArticle[] }) {
  if (guides.length === 0) return null;

  return (
    <section className="border-y border-border/60 bg-card py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Featured Guides</h2>
          <p className="mt-2 text-muted-foreground">Hand-picked long-form resources.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/${lang}/articles/${guide.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                <MediaImage type="guide" slug={guide.slug} name={guide.title} fill className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {guide.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {guide.description || "A comprehensive guide."}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {guide.reading_time} min read
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
