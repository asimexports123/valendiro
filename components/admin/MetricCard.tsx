"use client";

import { cn } from "@/components/ui/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  const trendClass =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-elevated)] transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {trend && (
          <span className={cn("text-xs font-semibold", trendClass)}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
