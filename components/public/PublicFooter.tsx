import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import type { NavCategory } from "@/services/public/publicData";

export function PublicFooter({
  lang,
  navCategories,
}: {
  lang: string;
  navCategories: NavCategory[];
}) {
  return (
    <footer className="border-t border-border/30 bg-muted/20">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories Grid */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {navCategories.map((cat) => (
            <div key={cat.slug}>
              <Link
                href={`/${lang}/categories/${cat.slug}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {cat.label}
              </Link>
              <ul className="mt-3 space-y-2">
                {cat.subcategories.slice(0, 4).map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      href={`/${lang}/subcategories/${sub.slug}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick Links */}
          <div>
            <p className="text-sm font-semibold text-foreground">Quick Links</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href={`/${lang}/articles`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  All Articles
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/search`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
