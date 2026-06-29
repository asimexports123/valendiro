import Link from "next/link";
import { DEFAULT_LANGUAGE, SITE_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <main className="relative w-full max-w-4xl px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          Autonomous Publishing Engine
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6">
          {SITE_NAME}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          A database-first, knowledge-graph powered operating system for building global multilingual knowledge platforms at scale.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/${DEFAULT_LANGUAGE}`}
            className="inline-flex items-center justify-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition"
          >
            Browse Public Site
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition"
          >
            Admin Dashboard
          </Link>
        </div>
      </main>
      <footer className="relative py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}
      </footer>
    </div>
  );
}
