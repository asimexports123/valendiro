"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_NAV_ITEMS, ADMIN_DEV_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/components/ui/utils";

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const devMode = searchParams.get("dev") === "1";

  const items = devMode
    ? [...ADMIN_NAV_ITEMS, ...ADMIN_DEV_NAV_ITEMS]
    : ADMIN_NAV_ITEMS;

  const devToggleHref = devMode
    ? pathname
    : `${pathname}?dev=1`;

  return (
    <nav className="space-y-1 flex flex-col h-full">
      <div className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full transition-colors", active ? "bg-primary-foreground" : "bg-muted-foreground/40 group-hover:bg-foreground/60")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Developer mode toggle — subtle, at the bottom */}
      <div className="pt-4 border-t border-border/40">
        <Link
          href={devToggleHref}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <span>{devMode ? "🔒" : "🛠️"}</span>
          {devMode ? "Exit Developer Mode" : "Developer Mode"}
        </Link>
      </div>
    </nav>
  );
}
