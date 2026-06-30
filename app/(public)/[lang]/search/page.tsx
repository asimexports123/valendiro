import { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { searchPublicContent } from "@/services/public/publicData";
import { EmptyState } from "@/components/public/EmptyState";

export const dynamic = "force-dynamic";

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
    title: q ? `"${q}" — Valendiro Search` : "Search — Valendiro",
    description: "Search trusted articles, guides, and topics on Valendiro.",
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
  const results = q.trim() ? await searchPublicContent(q.trim()) : { articles: [], topics: [] };
  const hasResults = results.articles.length > 0 || results.topics.length > 0;
  const total = results.articles.length + results.topics.length;

  return (
    <>
      {/* Search header */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          {q ? (
            <>
              <p className="text-sm font-medium text-muted-foreground mb-2">Search results</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">&ldquo;{q}&rdquo;</h1>
              {hasResults && <p className="mt-2 text-sm text-muted-foreground">{total} result{total !== 1 ? "s" : ""} found</p>}
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Search Valendiro</h1>
              <p className="mt-3 text-muted-foreground">Find trusted articles, guides, and topics.</p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        {!q && (
          <EmptyState
            emoji="🔍"
            title="Start searching"
            description="Type a keyword in the search bar above to find articles, guides, and topics."
            action={{ label: "Browse Categories", href: `/${lang}/categories` }}
          />
        )}

        {q && !hasResults && (
          <EmptyState
            emoji="💭"
            title={`No results for \u201c${q}\u201d`}
            description="Try a different keyword, or browse our categories to find what you are looking for."
            action={{ label: "Browse Categories", href: `/${lang}/categories` }}
          />
        )}

        {results.topics.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/${lang}/topics/${topic.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <span className="text-xs font-semibold text-primary/60 mb-1 uppercase tracking-wide">Topic</span>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{topic.title}</h3>
                  {topic.subtitle && <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{topic.subtitle}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {results.articles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${lang}/articles/${article.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <span className="text-xs font-semibold text-accent/70 mb-1 uppercase tracking-wide">Article</span>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{article.title}</h3>
                  {article.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{article.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
