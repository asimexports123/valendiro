"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HomepageStats } from "@/services/public/publicData";

const CATEGORIES = [
  { label: "Technology",       slug: "technology",       color: "bg-blue-500",    text: "text-blue-700 dark:text-blue-300",    ring: "hover:ring-blue-200 dark:hover:ring-blue-900" },
  { label: "Personal Finance", slug: "personal-finance", color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", ring: "hover:ring-emerald-200 dark:hover:ring-emerald-900" },
  { label: "Business",         slug: "business",         color: "bg-violet-500",  text: "text-violet-700 dark:text-violet-300",  ring: "hover:ring-violet-200 dark:hover:ring-violet-900" },
  { label: "Health & Wellness",slug: "health-wellness",  color: "bg-rose-500",    text: "text-rose-700 dark:text-rose-300",    ring: "hover:ring-rose-200 dark:hover:ring-rose-900" },
  { label: "Education",        slug: "education",        color: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   ring: "hover:ring-amber-200 dark:hover:ring-amber-900" },
  { label: "Home & Lifestyle", slug: "home-lifestyle",   color: "bg-orange-500",  text: "text-orange-700 dark:text-orange-300",  ring: "hover:ring-orange-200 dark:hover:ring-orange-900" },
  { label: "Travel",           slug: "travel",           color: "bg-sky-500",     text: "text-sky-700 dark:text-sky-300",     ring: "hover:ring-sky-200 dark:hover:ring-sky-900" },
];

const TRUST = [
  { icon: "✦", text: "Fact-checked sources" },
  { icon: "✦", text: "Expert-reviewed" },
  { icon: "✦", text: "Updated regularly" },
];

function fmt(n: number): string {
  if (n === 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`;
  return String(n);
}

export function Hero({ lang, stats }: { lang: string; stats: HomepageStats }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
  };

  const statItems = [
    stats.subcategories > 0 && { value: fmt(stats.subcategories), label: "Subcategories" },
    stats.topics > 0        && { value: fmt(stats.topics),        label: "Topics Covered" },
    stats.articles > 0      && { value: fmt(stats.articles),      label: "Articles" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Layered background: subtle grid + radial glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.35]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-5%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent)]" />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 lg:pt-28 lg:pb-24">
        <div className="max-w-2xl mx-auto text-center">

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-1.5 mb-7 shadow-xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Trusted Knowledge Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-foreground leading-[1.1] lg:leading-[1.08]">
            The knowledge you need,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">structured to last</span>
              <span className="absolute inset-x-0 bottom-1 h-[6px] bg-primary/10 rounded-full -z-0" />
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-[1.0625rem] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            In-depth guides, structured topic series, and fact-checked answers across technology, finance, health, and more.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8 max-w-lg mx-auto">
            <div className="group flex items-center gap-2 rounded-full border border-border/60 bg-card shadow-md px-2 py-2 pl-5 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)] transition-all duration-200">
              <svg className="h-4 w-4 text-muted-foreground/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, guides, questions…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category pills */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${lang}/categories/${cat.slug}`}
                className={`inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/70 backdrop-blur-sm px-3 py-1.5 text-[12px] font-medium ring-2 ring-transparent transition-all duration-150 hover:border-transparent hover:shadow-sm ${cat.text} ${cat.ring}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cat.color} shrink-0`} />
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Stats */}
          {statItems.length > 0 && (
            <div className="mt-10 inline-flex items-center divide-x divide-border/60 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
              {statItems.map((s) => (
                <div key={s.label} className="px-5 py-3 text-center">
                  <div className="text-lg font-bold text-foreground tabular-nums">{s.value}</div>
                  <div className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Trust signals */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            {TRUST.map((t) => (
              <span key={t.text} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <span className="text-primary/60 text-[8px]">{t.icon}</span>
                {t.text}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
