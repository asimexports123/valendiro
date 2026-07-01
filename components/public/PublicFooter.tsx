import Link from "next/link";
import { getNavData } from "@/services/public/publicData";

export async function PublicFooter({ lang }: { lang: string }) {
  const categories = await getNavData();

  const quickLinks = [
    { label: "Articles", href: `/${lang}/articles` },
    { label: "Categories", href: `/${lang}/categories` },
    { label: "About", href: `/${lang}/about` },
    { label: "Contact", href: `/${lang}/contact` },
    { label: "Privacy Policy", href: `/${lang}/privacy` },
    { label: "Terms of Service", href: `/${lang}/terms` },
  ];

  return (
    <footer className="border-t border-border/50 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="col-span-full lg:col-span-1">
            <Link href={`/${lang}`} className="inline-flex items-center gap-2 text-xl font-bold text-foreground">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
              </svg>
              Valendiro
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Your trusted source for in-depth knowledge and structured learning paths across essential topics.
            </p>
          </div>

          {/* Categories with subcategories */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.slug}>
                  <Link href={`/${lang}/categories/${cat.slug}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {cat.label}
                  </Link>
                  {cat.subcategories.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {cat.subcategories.slice(0, 4).map((sub) => (
                        <li key={sub.slug}>
                          <Link href={`/${lang}/subcategories/${sub.slug}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                      {cat.subcategories.length > 4 && (
                        <li>
                          <Link href={`/${lang}/categories/${cat.slug}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            View all...
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border/50 pt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Valendiro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
