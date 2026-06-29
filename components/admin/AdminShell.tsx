"use client";

import { useState } from "react";
import { AdminNav } from "./AdminNav";
import { AdminHeader } from "./AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminHeader onMenuClick={() => setMobileOpen(!mobileOpen)} />
      <div className="flex flex-1 max-w-[100vw]">
        <aside className="hidden md:block w-64 shrink-0 border-r border-border/60 bg-muted/30">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
            <AdminNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative z-50 h-full w-64 border-r border-border/60 bg-background p-4">
              <AdminNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
