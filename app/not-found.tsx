import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <span className="text-7xl mb-6">🗺️</span>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">404</h1>
      <p className="mt-3 text-xl font-semibold text-foreground">Page not found</p>
      <p className="mt-3 text-base text-muted-foreground max-w-md leading-relaxed">
        This page does not exist or has been moved. Try searching, or start from the homepage.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          href="/en"
          className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/en/categories"
          className="inline-flex items-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/30 transition-colors"
        >
          Browse categories
        </Link>
      </div>
    </div>
  );
}
