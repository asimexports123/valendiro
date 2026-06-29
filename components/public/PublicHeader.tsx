"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_NAME } from "@/lib/constants";

const navItems = [
  { label: "Categories", href: "categories" },
  { label: "Guides", href: "articles" },
  { label: "Latest", href: "latest" },
  { label: "Collections", href: "collections" },
  { label: "About", href: "about" },
];

export function PublicHeader({ lang, showAdmin }: { lang: string; showAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              V
            </span>
            {SITE_NAME}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${lang}${item.href ? `/${item.href}` : ""}`}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-card"
              >
                {item.label}
              </Link>
            ))}
            {showAdmin && (
              <Link
                href="/admin/dashboard"
                className="px-3 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={`/${lang}/search`}
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition"
            >
              Search
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md hover:bg-card"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${lang}${item.href ? `/${item.href}` : ""}`}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-card"
              >
                {item.label}
              </Link>
            ))}
            {showAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-medium text-accent hover:text-accent/80"
              >
                Admin
              </Link>
            )}
            <Link
              href={`/${lang}/search`}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Search
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
