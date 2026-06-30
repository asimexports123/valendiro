import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

const FOOTER_LINKS = [
  { label: "Categories", href: "categories" },
  { label: "Collections", href: "collections" },
  { label: "Guides", href: "articles" },
  { label: "Topics", href: "topics" },
  { label: "About", href: "about" },
  { label: "Privacy", href: "privacy" },
  { label: "Terms", href: "terms" },
  { label: "Contact", href: "contact" },
];

export function PublicFooter({ lang }: { lang: string }) {
  return (
    <footer className="border-t border-border/60 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href={`/${lang}`} className="flex items-center gap-2 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              V
            </span>
            <span className="text-sm font-semibold text-foreground">{SITE_NAME}</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={`/${lang}/${link.href}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-muted-foreground shrink-0">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
