"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HomepageStats } from "@/services/public/publicData";

const CATEGORIES = [
  { label: "Technology", slug: "technology", color: "bg-blue-500" },
  { label: "Personal Finance", slug: "personal-finance", color: "bg-emerald-500" },
  { label: "Business", slug: "business", color: "bg-violet-500" },
  { label: "Education", slug: "education", color: "bg-amber-500" },
  { label: "Health & Wellness", slug: "health-wellness", color: "bg-rose-500" },
  { label: "Home & Lifestyle", slug: "home-lifestyle", color: "bg-orange-500" },
  { label: "Travel", slug: "travel", color: "bg-sky-500" },
];

function fmt(n: number): string {
  if (n === 0) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
  return String(n);
}

export function Hero({ lang, stats }: { lang: string; stats: HomepageStats }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_srgb,var(--primary)_6%,transparent),transparent)]" />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            Trusted answers for
            <span className="text-primary"> everything</span> that matters
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Structured guides and in-depth articles on technology, finance, business, health, and more. Read complete topic series from start to finish.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card shadow-sm px-4 py-2 focus-within:border-primary/40 focus-within:shadow-md transition-all duration-200">
              <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, topics or questions..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-1"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${lang}/categories/${cat.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm transition-all duration-150"
              >
                <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Stats — only show if there is meaningful data */}
          {(stats.subcategories > 0 || stats.topics > 0 || stats.articles > 0) && (
            <div className="mt-10 flex items-center justify-center gap-6 text-center">
              {stats.subcategories > 0 && (
                <div>
                  <div className="text-xl font-bold text-foreground">{fmt(stats.subcategories)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Subcategories</div>
                </div>
              )}
              {stats.subcategories > 0 && stats.topics > 0 && <div className="w-px h-6 bg-border/50" />}
              {stats.topics > 0 && (
                <div>
                  <div className="text-xl font-bold text-foreground">{fmt(stats.topics)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Topics</div>
                </div>
              )}
              {stats.topics > 0 && stats.articles > 0 && <div className="w-px h-6 bg-border/50" />}
              {stats.articles > 0 && (
                <div>
                  <div className="text-xl font-bold text-foreground">{fmt(stats.articles)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Articles</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
