"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const trendingExamples = [
  { label: "AI", href: "search?q=AI" },
  { label: "Finance", href: "search?q=Finance" },
  { label: "Health", href: "search?q=Health" },
  { label: "Programming", href: "search?q=Programming" },
  { label: "Travel", href: "search?q=Travel" },
  { label: "Cybersecurity", href: "search?q=Cybersecurity" },
  { label: "Startup", href: "search?q=Startup" },
];

export function Hero({ lang }: { lang: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative border-b border-border/60 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.1]">
          Discover what the world is asking.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Explore structured knowledge, trending topics, and expert articles from a trusted global knowledge platform.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, articles, or questions..."
                className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">Trending:</span>
          {trendingExamples.map((item) => (
            <Link
              key={item.label}
              href={`/${lang}/${item.href}`}
              className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-muted transition"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
