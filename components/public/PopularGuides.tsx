import Link from "next/link";
import { PublicArticle } from "@/services/public/publicData";

export function PopularGuides({ lang, guides }: { lang: string; guides: PublicArticle[] }) {
  if (guides.length === 0) return null;

  return (
    <section className="py-14 sm:py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Featured Guides</h2>
          <Link href={`/${lang}/articles`} className="text-sm font-medium text-accent hover:text-accent/80 transition">
            Browse all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/${lang}/articles/${guide.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary text-lg">
                📖
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                  {guide.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {guide.description || "A comprehensive guide."}
                </p>
                <p className="mt-2.5 text-xs text-muted-foreground">{guide.reading_time} min read</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
