import Link from "next/link";
import { HomepageStats } from "@/services/public/publicData";

const EXPLORE_LINKS = [
  { emoji: "💻", label: "Technology",           href: "categories/technology",       color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60" },
  { emoji: "💰", label: "Personal Finance",     href: "categories/personal-finance", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60" },
  { emoji: "🚀", label: "Business",             href: "categories/business",         color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60" },
  { emoji: "📚", label: "Education & Learning", href: "categories/education",        color: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60" },
  { emoji: "🏃", label: "Health & Wellness",    href: "categories/health-wellness",  color: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60" },
  { emoji: "🏠", label: "Home & Lifestyle",     href: "categories/home-lifestyle",   color: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60" },
  { emoji: "✈️", label: "Travel & Transportation", href: "categories/travel",        color: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60" },
];

function fmt(n: number): string {
  if (n === 0) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
  return String(n);
}

export function Hero({ lang, stats }: { lang: string; stats: HomepageStats }) {
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-card">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 sm:py-28 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1.5 text-xs font-medium text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Knowledge Platform for Curious Minds
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.1]">
              Learn anything.
              <span className="block mt-1 text-primary">Understand everything.</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              Valendiro is a premium knowledge platform with in-depth guides, tutorials, and answers across technology, finance, health, education, and more.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                href={`/${lang}/categories`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Explore Topics
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href={`/${lang}/articles`}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Browse Guides
              </Link>
            </div>

            {/* Trust pillars — real DB numbers only */}
            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-5">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-foreground tracking-tight">7</div>
                <div className="text-xs text-muted-foreground mt-0.5">Knowledge Areas</div>
              </div>
              <div className="w-px h-8 bg-border/60 hidden sm:block" />
              {stats.topics > 0 ? (
                <>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-foreground tracking-tight">{fmt(stats.topics)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Topics</div>
                  </div>
                  <div className="w-px h-8 bg-border/60 hidden sm:block" />
                </>
              ) : null}
              {stats.articles > 0 ? (
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-foreground tracking-tight">{fmt(stats.articles)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Articles</div>
                </div>
              ) : (
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-foreground tracking-tight">Growing</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Library</div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Illustration — hidden on mobile */}
          <div className="hidden lg:flex flex-1 items-center justify-center lg:justify-end w-full max-w-lg">
            <div className="relative w-full max-w-md">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-3xl scale-110" />
              {/* SVG Illustration */}
              <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-auto drop-shadow-xl">
                {/* Background card */}
                <rect x="20" y="20" width="440" height="340" rx="24" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5"/>

                {/* Top bar */}
                <rect x="20" y="20" width="440" height="52" rx="24" fill="var(--muted)"/>
                <rect x="20" y="48" width="440" height="24" fill="var(--muted)"/>
                <circle cx="52" cy="46" r="7" fill="#ef4444" opacity="0.7"/>
                <circle cx="72" cy="46" r="7" fill="#f59e0b" opacity="0.7"/>
                <circle cx="92" cy="46" r="7" fill="#10b981" opacity="0.7"/>

                {/* Content area */}
                {/* Title */}
                <rect x="48" y="96" width="180" height="14" rx="7" fill="var(--foreground)" opacity="0.85"/>
                <rect x="48" y="118" width="280" height="8" rx="4" fill="var(--border)" opacity="0.8"/>
                <rect x="48" y="134" width="240" height="8" rx="4" fill="var(--border)" opacity="0.6"/>

                {/* Category pills */}
                <rect x="48" y="162" width="72" height="24" rx="12" fill="#eff6ff"/>
                <rect x="52" y="169" width="12" height="10" rx="3" fill="#3b82f6" opacity="0.8"/>
                <rect x="68" y="170" width="44" height="8" rx="4" fill="#3b82f6" opacity="0.6"/>

                <rect x="130" y="162" width="80" height="24" rx="12" fill="#f0fdf4"/>
                <rect x="134" y="169" width="12" height="10" rx="3" fill="#10b981" opacity="0.8"/>
                <rect x="150" y="170" width="52" height="8" rx="4" fill="#10b981" opacity="0.6"/>

                <rect x="220" y="162" width="68" height="24" rx="12" fill="#fef3c7"/>
                <rect x="224" y="169" width="12" height="10" rx="3" fill="#f59e0b" opacity="0.8"/>
                <rect x="240" y="170" width="40" height="8" rx="4" fill="#f59e0b" opacity="0.6"/>

                {/* Article cards row */}
                <rect x="48" y="206" width="120" height="100" rx="12" fill="var(--muted)" opacity="0.7"/>
                <rect x="56" y="248" width="80" height="6" rx="3" fill="var(--foreground)" opacity="0.5"/>
                <rect x="56" y="260" width="96" height="5" rx="2.5" fill="var(--border)" opacity="0.8"/>
                <rect x="56" y="271" width="72" height="5" rx="2.5" fill="var(--border)" opacity="0.6"/>
                <rect x="56" y="218" width="104" height="22" rx="6" fill="var(--primary)" opacity="0.12"/>
                <rect x="64" y="224" width="60" height="10" rx="3" fill="var(--primary)" opacity="0.5"/>

                <rect x="180" y="206" width="120" height="100" rx="12" fill="var(--muted)" opacity="0.7"/>
                <rect x="188" y="248" width="80" height="6" rx="3" fill="var(--foreground)" opacity="0.5"/>
                <rect x="188" y="260" width="96" height="5" rx="2.5" fill="var(--border)" opacity="0.8"/>
                <rect x="188" y="271" width="72" height="5" rx="2.5" fill="var(--border)" opacity="0.6"/>
                <rect x="188" y="218" width="104" height="22" rx="6" fill="#10b981" opacity="0.12"/>
                <rect x="196" y="224" width="60" height="10" rx="3" fill="#10b981" opacity="0.5"/>

                <rect x="312" y="206" width="120" height="100" rx="12" fill="var(--muted)" opacity="0.7"/>
                <rect x="320" y="248" width="80" height="6" rx="3" fill="var(--foreground)" opacity="0.5"/>
                <rect x="320" y="260" width="96" height="5" rx="2.5" fill="var(--border)" opacity="0.8"/>
                <rect x="320" y="271" width="72" height="5" rx="2.5" fill="var(--border)" opacity="0.6"/>
                <rect x="320" y="218" width="104" height="22" rx="6" fill="#f59e0b" opacity="0.12"/>
                <rect x="328" y="224" width="60" height="10" rx="3" fill="#f59e0b" opacity="0.5"/>

                {/* Bottom bar */}
                <rect x="48" y="322" width="160" height="8" rx="4" fill="var(--border)" opacity="0.5"/>
                <rect x="48" y="338" width="100" height="6" rx="3" fill="var(--border)" opacity="0.35"/>

                {/* Floating badge */}
                <rect x="330" y="88" width="110" height="36" rx="10" fill="var(--primary)" opacity="0.95"/>
                <rect x="344" y="100" width="44" height="6" rx="3" fill="white" opacity="0.9"/>
                <rect x="344" y="111" width="60" height="5" rx="2.5" fill="white" opacity="0.6"/>
                <circle cx="338" cy="106" r="6" fill="white" opacity="0.25"/>
              </svg>

              {/* Floating badge — real DB stats */}
              <div className="absolute -top-4 -right-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-elevated">
                <div className="text-xs text-muted-foreground">Collections</div>
                <div className="text-xl font-bold text-primary mt-0.5">
                  {stats.collections > 0 ? fmt(stats.collections) : "Growing"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category quick-access strip */}
        <div className="pb-10 sm:pb-14">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Explore:</span>
            {EXPLORE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={`/${lang}/${item.href}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${item.color}`}
              >
                <span>{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
