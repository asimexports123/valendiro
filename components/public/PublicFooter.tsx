import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import type { NavCategory } from "@/services/public/publicData";

/** Short labels for header/footer nav — matches pre-DB-sync UI. */
const NAV_SHORT_LABELS: Record<string, string> = {
  education: "Education",
  travel: "Travel",
};

function navLabel(cat: NavCategory): string {
  return NAV_SHORT_LABELS[cat.slug] ?? cat.label;
}

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
                {navLabel(cat)}
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
                <Link href={`/${lang}/categories`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/about`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/contact`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/terms`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href={`/${lang}`} className="flex items-center gap-2 shrink-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[10px]">
              V
            </span>
            <span className="text-sm font-bold text-foreground">{SITE_NAME}</span>
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {SITE_NAME}. Trusted answers for everything that matters.
            </p>
            <p className="text-xs text-muted-foreground">
              Build: {new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
