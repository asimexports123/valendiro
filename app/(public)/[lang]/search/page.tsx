import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { searchPublicContent } from "@/services/public/publicData";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search results for "${q}" — Valendiro` : "Search — Valendiro",
    description: "Search millions of articles, guides, and answers on Valendiro.",
    canonical: `/${lang}/search`,
  });
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await params;
  const { q = "" } = await searchParams;
  const results = q ? await searchPublicContent(q) : { articles: [], topics: [] };
  const hasResults = results.articles.length > 0 || results.topics.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
        {q ? `Search results for "${q}"` : "Search Valendiro"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Find trusted articles, guides, and answers across every topic.
      </p>

      {q && !hasResults && (
        <p className="mt-8 text-muted-foreground">
          No results found. Try a different keyword or browse <Link href={`/${lang}/categories`} className="text-accent hover:underline">categories</Link>.
        </p>
      )}

      {results.articles.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.articles.map((article) => (
              <Link
                key={article.id}
                href={`/${lang}/articles/${article.slug}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{article.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.excerpt || ""}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {results.topics.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/${lang}/topics/${topic.slug}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{topic.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{topic.subtitle || ""}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
