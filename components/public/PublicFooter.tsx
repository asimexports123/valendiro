"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const exploreLinks = [
  { label: "Categories", href: "categories" },
  { label: "Guides", href: "articles" },
  { label: "Latest", href: "latest" },
  { label: "Collections", href: "collections" },
  { label: "About", href: "about" },
];

const companyLinks = [
  { label: "About Us", href: "about" },
  { label: "Contact", href: "contact" },
  { label: "Sitemap", href: "api/sitemap" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "privacy" },
  { label: "Terms of Service", href: "terms" },
  { label: "Contact", href: "contact" },
];

export function PublicFooter({ lang }: { lang: string }) {
  return (
    <footer className="border-t border-border/60 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href={`/${lang}`} className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-background">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-foreground font-bold text-sm">
                V
              </span>
              {SITE_NAME}
            </Link>
            <p className="mt-4 text-sm text-background/70 max-w-sm leading-relaxed">
              Your trusted source for structured knowledge and expert insights. We make it easy to understand the world around you.
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium text-background">Stay Updated</p>
              <p className="mt-1 text-sm text-background/70">Get the latest knowledge in your inbox.</p>
              <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 rounded-lg border border-background/20 bg-background/10 px-3 py-2 text-sm text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-background/30"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-background/90 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 lg:col-start-7">
            <h3 className="text-sm font-semibold text-background mb-4">Explore</h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={`/${lang}/${link.href}`} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-background mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href.startsWith("api") ? `/${link.href}` : `/${lang}/${link.href}`} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-background mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={`/${lang}/${link.href}`} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/60">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-background/60">Made for curious minds.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
