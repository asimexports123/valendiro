import Link from "next/link";
import { MediaImage } from "./MediaImage";
import { PublicCategory } from "@/services/public/publicData";

export function CategoryGrid({ lang, categories }: { lang: string; categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Featured Categories</h2>
          <p className="mt-2 text-muted-foreground">Explore knowledge organized by topic.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${lang}/categories/${category.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
            >
              <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                <MediaImage type="category" slug={category.slug} name={category.name} width={48} height={48} className="rounded-xl" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {category.description || `${category.article_count} articles`}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {category.article_count} article{category.article_count === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
