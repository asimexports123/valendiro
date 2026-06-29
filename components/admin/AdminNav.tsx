"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/components/ui/utils";

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ADMIN_NAV_ITEMS.map((item) => {
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
    </nav>
  );
}
