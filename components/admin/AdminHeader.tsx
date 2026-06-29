"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[100vw] mx-auto px-4 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-accent"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold text-foreground tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              V
            </span>
            <span className="hidden sm:inline">{SITE_NAME}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            View Site
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
