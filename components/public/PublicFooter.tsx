import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const FOOTER_CATEGORIES = [
  { label: "Technology", slug: "technology", subs: ["Artificial Intelligence", "Web Development", "Cybersecurity", "Data Science"] },
  { label: "Personal Finance", slug: "personal-finance", subs: ["Investing", "Budgeting & Saving", "Credit & Debt", "Retirement"] },
  { label: "Business", slug: "business", subs: ["Entrepreneurship", "Marketing & Growth", "Leadership", "Startups"] },
  { label: "Education", slug: "education", subs: ["Learning Methods", "Study Skills", "Career Development", "Languages"] },
  { label: "Health & Wellness", slug: "health-wellness", subs: ["Fitness & Exercise", "Nutrition & Diet", "Mental Health", "Sleep"] },
  { label: "Home & Lifestyle", slug: "home-lifestyle", subs: ["Home Organisation", "Cooking & Recipes", "DIY & Repairs", "Productivity"] },
  { label: "Travel", slug: "travel", subs: ["Destination Guides", "Budget Travel", "Solo Travel", "Travel Planning"] },
];

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function PublicFooter({ lang }: { lang: string }) {
  return (
    <footer className="border-t border-border/30 bg-muted/20">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories Grid */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {FOOTER_CATEGORIES.map((cat) => (
            <div key={cat.slug}>
              <Link
                href={`/${lang}/categories/${cat.slug}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {cat.label}
              </Link>
              <ul className="mt-3 space-y-2">
                {cat.subs.map((sub) => (
                  <li key={sub}>
                    <Link
                      href={`/${lang}/subcategories/${toSlug(sub)}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {sub}
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
              <li><Link href={`/${lang}/articles`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">All Articles</Link></li>
              <li><Link href={`/${lang}/categories`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">All Categories</Link></li>
              <li><Link href={`/${lang}/about`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href={`/${lang}/contact`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href={`/${lang}/privacy`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href={`/${lang}/terms`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Use</Link></li>
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
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. Trusted answers for everything that matters.
          </p>
        </div>
      </div>
    </footer>
  );
}
