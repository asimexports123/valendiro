"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SITE_NAME } from "@/lib/constants";
import { NavCategory } from "@/services/public/publicData";

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  technology:        { color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40" },
  "personal-finance":{ color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  business:          { color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  education:         { color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/40" },
  "health-wellness": { color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/40" },
  "home-lifestyle":  { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  travel:            { color: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-50 dark:bg-sky-950/40" },
};

function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
    >
      {dark ? (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export function PublicHeader({ lang, navCategories }: { lang: string; navCategories: NavCategory[] }) {
  const CATEGORIES = navCategories.map((cat) => ({
    ...cat,
    color: CAT_COLORS[cat.slug]?.color || "text-primary",
    bg: CAT_COLORS[cat.slug]?.bg || "bg-muted",
  }));
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchOpen(false);
      setMobileOpen(false);
      router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const openDropdown = useCallback((i: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(i);
  }, []);

  const closeDropdown = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ── Sticky Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href={`/${lang}`} className="flex items-center gap-2 shrink-0 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                V
              </span>
              <span className="text-[15px] font-bold tracking-tight text-foreground hidden sm:block">
                {SITE_NAME}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav ref={navRef} className="hidden lg:flex items-center gap-0.5 ml-8">
              {CATEGORIES.map((cat, i) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => openDropdown(i)}
                  onMouseLeave={closeDropdown}
                >
                  <Link
                    href={`/${lang}/categories/${cat.slug}`}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${
                      activeDropdown === i
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {cat.label}
                    <svg className={`h-3 w-3 opacity-50 transition-transform duration-200 ${activeDropdown === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  {/* Dropdown */}
                  {activeDropdown === i && (
                    <div
                      className="absolute top-full left-0 pt-2 z-50"
                      onMouseEnter={() => openDropdown(i)}
                      onMouseLeave={closeDropdown}
                    >
                      <div className="w-[280px] rounded-xl border border-border/50 bg-card shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3 py-2 mb-1">
                          <p className={`text-xs font-bold ${cat.color}`}>{cat.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{cat.subcategories.length} subcategories</p>
                        </div>
                        <div className="space-y-0.5">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.slug}
                              href={`/${lang}/subcategories/${sub.slug}`}
                              onClick={() => setActiveDropdown(null)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-100"
                            >
                              <span className="flex h-1.5 w-1.5 rounded-full bg-border shrink-0" />
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                        <div className="mt-1 pt-1 border-t border-border/40">
                          <Link
                            href={`/${lang}/categories/${cat.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${cat.color} hover:${cat.bg} transition-colors`}
                          >
                            View all {cat.label}
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border/60 transition-all duration-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden lg:inline-flex h-4 items-center rounded border border-border/50 bg-background px-1 text-[9px] font-mono text-muted-foreground/70">⌘K</kbd>
              </button>

              <DarkModeToggle />

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
                aria-label="Menu"
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[300px] bg-background border-r border-border/40 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/40">
              <span className="font-bold text-foreground text-sm">{SITE_NAME}</span>
              <button onClick={() => setMobileOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              {/* Search */}
              <div className="px-3 mb-3">
                <button
                  onClick={() => { setSearchOpen(true); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/40 text-sm text-muted-foreground"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search topics, articles...
                </button>
              </div>

              {/* Categories */}
              <div className="px-3 space-y-0.5">
                {CATEGORIES.map((cat) => (
                  <details key={cat.slug} className="group">
                    <summary className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 cursor-pointer list-none transition-colors">
                      <span>{cat.label}</span>
                      <svg className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="pl-4 pr-2 pb-2 space-y-0.5">
                      <Link
                        href={`/${lang}/categories/${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold ${cat.color} hover:bg-muted/40 transition-colors`}
                      >
                        All {cat.label} →
                      </Link>
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/${lang}/subcategories/${sub.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </div>

              {/* Quick links */}
              <div className="mt-4 pt-3 border-t border-border/40 px-3 space-y-0.5">
                <Link href={`/${lang}/articles`} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  All Articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Modal ─────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-border/50 bg-card shadow-[0_24px_60px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-3 px-5 py-4">
                <svg className="h-5 w-5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search topics, articles, subcategories..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none"
                />
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="text-[11px] text-muted-foreground border border-border/50 rounded-md px-2 py-0.5 hover:bg-muted transition-colors font-mono">
                  Esc
                </button>
              </div>
            </form>
            <div className="border-t border-border/40 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">Categories</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${lang}/categories/${c.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-muted/60 transition-colors`}
                  >
                    <span className={`h-2 w-2 rounded-full ${c.bg} border ${c.color.includes("blue") ? "border-blue-300 dark:border-blue-700" : c.color.includes("emerald") ? "border-emerald-300 dark:border-emerald-700" : c.color.includes("violet") ? "border-violet-300 dark:border-violet-700" : c.color.includes("amber") ? "border-amber-300 dark:border-amber-700" : c.color.includes("rose") ? "border-rose-300 dark:border-rose-700" : c.color.includes("orange") ? "border-orange-300 dark:border-orange-700" : "border-sky-300 dark:border-sky-700"}`} />
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
