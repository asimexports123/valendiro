import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function PublicFooter({
  lang,
}: {
  lang: string;
}) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                Content
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${lang}/topics`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    Topics
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/categories`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    Categories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                About
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${lang}/about`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/contact`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                Legal
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${lang}/privacy`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href={`/${lang}/terms`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <Link href={`/${lang}`} className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {SITE_NAME}
              </Link>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Expert articles and guides across technology, finance, health, and more.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
