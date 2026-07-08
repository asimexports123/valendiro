"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Search,
  Database,
  FileText,
  Settings,
  Activity,
  Globe,
  Layers,
  CheckCircle,
  Link2,
  Zap,
  BarChart3,
  Brain,
  Radio,
  Network,
  Shield,
  Rocket,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "valendiro-mission-control-sidebar";

const NAV = [
  {
    group: "Overview",
    items: [
      { name: "Mission Control", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
      { name: "Analytics", href: "/admin/dashboard/analytics", icon: BarChart3 },
      { name: "System Health", href: "/admin/dashboard/system-health", icon: Activity },
    ],
  },
  {
    group: "Knowledge",
    items: [
      { name: "Topics", href: "/admin/dashboard/articles", icon: FileText },
      { name: "Packages", href: "/admin/dashboard/knowledge", icon: Brain },
      { name: "Categories", href: "/admin/dashboard/categories", icon: Layers },
      { name: "Graph", href: "/admin/dashboard/knowledge", icon: Network },
    ],
  },
  {
    group: "Pipeline",
    items: [
      { name: "Discovery", href: "/admin/dashboard/discovery", icon: Search },
      { name: "Sources", href: "/admin/dashboard/sources", icon: Radio },
      { name: "Rendering", href: "/admin/dashboard/rendering", icon: Layers },
      { name: "Publishing", href: "/admin/dashboard/publishing", icon: Rocket },
      { name: "Automation", href: "/admin/dashboard/automation", icon: Zap },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { name: "Quality", href: "/admin/dashboard/quality", icon: CheckCircle },
      { name: "SEO", href: "/admin/dashboard/seo", icon: Globe },
      { name: "Internal Links", href: "/admin/dashboard/internal-links", icon: Link2 },
      { name: "Trust", href: "/admin/dashboard/quality", icon: Shield },
    ],
  },
  {
    group: "System",
    items: [
      { name: "Logs", href: "/admin/dashboard/logs", icon: Database },
      { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
    ],
  },
];

export default function CEODashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      if (saved === "closed") setOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "open" : "closed");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string, exact?: boolean) => {
    if (!mounted || !pathname) return false;
    if (exact) return pathname === href;
    return pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
  };

  return (
    <div className="flex h-screen bg-[#050913] text-slate-100">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#080f1d] to-[#060a12] transition-[width,transform,opacity] duration-300 ease-out overflow-hidden",
          open ? "w-[252px] opacity-100" : "w-0 opacity-0 pointer-events-none border-r-0"
        )}
        aria-hidden={!open}
      >
        <div className="flex min-w-[252px] flex-col h-full">
          <div className="border-b border-white/[0.06] px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-900/40">
                  V
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#080f1d] bg-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold tracking-tight text-white truncate">Valendiro</div>
                  <div className="text-[10px] tracking-wide text-slate-500 truncate">Knowledge OS · Admin</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Hide sidebar"
                className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
            {NAV.map((section) => (
              <div key={section.group}>
                <div className="mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {section.group}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href, "exact" in item ? item.exact : false);
                    return (
                      <Link
                        key={item.name + item.href}
                        href={item.href}
                        suppressHydrationWarning
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition",
                          active
                            ? "bg-violet-500/15 text-violet-100"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                        )}
                      >
                        {active && (
                          <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-violet-400" />
                        )}
                        <item.icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-400"
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-2 border-t border-white/[0.06] p-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2 text-[11px] text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Production live
            </div>
            <Link
              href="/en"
              target="_blank"
              className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
            >
              Public site <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {!open && (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Show sidebar"
            className="fixed left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0c1428]/95 px-2.5 py-2 text-[11px] text-slate-300 shadow-lg backdrop-blur-sm transition hover:bg-[#121c33] hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" />
            Menu
          </button>
        )}

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
