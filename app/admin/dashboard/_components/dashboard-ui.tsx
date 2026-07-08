"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function Panel({
  children,
  className,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "violet" | "sky" | "emerald" | "amber" | "rose" | "none";
}) {
  const accentBar =
    accent && accent !== "none"
      ? {
          violet: "from-violet-500/80 via-violet-400/40 to-transparent",
          sky: "from-sky-500/80 via-sky-400/40 to-transparent",
          emerald: "from-emerald-500/80 via-emerald-400/40 to-transparent",
          amber: "from-amber-500/80 via-amber-400/40 to-transparent",
          rose: "from-rose-500/80 via-rose-400/40 to-transparent",
        }[accent]
      : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.07]",
        "bg-gradient-to-b from-[#121c33]/90 to-[#0a1020]/95",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {accentBar && (
        <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r", accentBar)} />
      )}
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[13px] font-semibold tracking-tight text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-violet-300"
        >
          {action ?? "View"}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</div>
  );
}

export function MetricTile({
  href,
  label,
  value,
  hint,
  icon: Icon,
  tone = "violet",
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: { text: string; positive?: boolean; warn?: boolean };
  icon: LucideIcon;
  tone?: "violet" | "sky" | "emerald" | "amber" | "fuchsia" | "blue";
}) {
  const tones = {
    violet: "text-violet-300 bg-violet-500/10 ring-violet-400/20",
    sky: "text-sky-300 bg-sky-500/10 ring-sky-400/20",
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-400/20",
    fuchsia: "text-fuchsia-300 bg-fuchsia-500/10 ring-fuchsia-400/20",
    blue: "text-blue-300 bg-blue-500/10 ring-blue-400/20",
  };

  return (
    <Link
      href={href}
      className="group relative flex min-h-[108px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c1428]/80 p-4 transition duration-200 hover:border-white/15 hover:bg-[#101a32]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 font-mono text-[26px] font-semibold leading-none tracking-tight text-white tabular-nums">
            {value}
          </div>
        </div>
        <div className={cn("rounded-xl p-2.5 ring-1", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {hint ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
              hint.warn
                ? "bg-amber-500/10 text-amber-300"
                : hint.positive === false
                  ? "text-slate-400"
                  : "bg-emerald-500/10 text-emerald-300"
            )}
          >
            {hint.text}
          </span>
        ) : (
          <span className="text-[10px] text-slate-600">Live count</span>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-slate-600 opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  );
}

export function statusTone(status: string) {
  if (status === "healthy" || status === "idle") return "text-emerald-300 bg-emerald-500/10";
  if (status === "running" || status === "busy") return "text-sky-300 bg-sky-500/10";
  if (status === "warn" || status === "degraded") return "text-amber-300 bg-amber-500/10";
  if (status === "down" || status === "error") return "text-rose-300 bg-rose-500/10";
  return "text-slate-400 bg-slate-500/10";
}

export function PipelineFlow({
  stages,
}: {
  stages: { id: string; label: string; count: number; status: string; href: string }[];
}) {
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      <div className="relative grid grid-cols-5 gap-1">
        <div className="pointer-events-none absolute left-[10%] right-[10%] top-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {stages.slice(0, 5).map((stage, i) => (
          <Link
            key={stage.id}
            href={stage.href}
            className="group relative z-[1] rounded-xl border border-white/[0.06] bg-black/20 px-2 py-3 text-center transition hover:border-violet-400/25 hover:bg-black/30"
          >
            <div
              className={cn(
                "mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-[#0c1428]",
                statusTone(stage.status)
              )}
            >
              {i + 1}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{stage.label}</div>
            <div className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-white">{fmt(stage.count)}</div>
            <div className="mx-auto mt-2 h-1 w-full max-w-[72px] overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all"
                style={{ width: `${Math.max(8, (stage.count / max) * 100)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  segments,
}: {
  segments: { pct: number; color: string; label: string }[];
}) {
  let offset = 0;
  const circles = segments.map((s) => {
    const dash = (s.pct / 100) * 100;
    const el = (
      <circle
        key={s.label}
        cx="18"
        cy="18"
        r="15.915"
        fill="none"
        stroke={s.color}
        strokeWidth="3.4"
        strokeDasharray={`${dash} ${100 - dash}`}
        strokeDashoffset={25 - offset}
        strokeLinecap="round"
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg viewBox="0 0 36 36" className="h-[92px] w-[92px] -rotate-90 shrink-0">
      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="3.4" />
      {circles}
    </svg>
  );
}

export function QualityGauge({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#a78bfa" : score >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative mx-auto h-[132px] w-[132px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(30,41,59,0.9)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          className="drop-shadow-[0_0_10px_rgba(167,139,250,0.35)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[34px] font-bold leading-none text-white tabular-nums">{score}</div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-slate-500">Quality</div>
      </div>
    </div>
  );
}

export function GraphPreview({ entities, relationships }: { entities: number; relationships: number }) {
  const nodes = [
    { x: 50, y: 28, r: 5 },
    { x: 22, y: 48, r: 4 },
    { x: 78, y: 44, r: 4.5 },
    { x: 35, y: 72, r: 3.5 },
    { x: 65, y: 70, r: 3.5 },
    { x: 50, y: 52, r: 7 },
  ];
  const edges = [
    [0, 5],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [0, 2],
    [1, 3],
    [2, 4],
  ];

  return (
    <div className="relative h-[120px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#070d18]">
      <svg viewBox="0 0 100 88" className="absolute inset-0 h-full w-full">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="rgba(139,92,246,0.25)"
            strokeWidth="0.6"
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={i === 5 ? "rgba(139,92,246,0.85)" : "rgba(56,189,248,0.55)"}
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070d18] via-[#070d18]/90 to-transparent px-3 pb-2.5 pt-6">
        <div className="font-mono text-sm font-semibold text-white tabular-nums">{fmt(entities)}</div>
        <div className="text-[10px] text-slate-500">{fmt(relationships)} graph links</div>
      </div>
    </div>
  );
}

export function HealthRow({ label, status, detail }: { label: string; status: string; detail?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-slate-300">{label}</div>
        {detail && <div className="mt-0.5 truncate text-[10px] text-slate-500">{detail}</div>}
      </div>
      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusTone(status))}>
        {status}
      </span>
    </div>
  );
}

export function IntegrationSlot({
  title,
  status,
  metrics,
  href,
}: {
  title: string;
  status: "connected" | "pending";
  metrics?: { label: string; value: string }[];
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-slate-300">{title}</div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            status === "connected" ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700/50 text-slate-400"
          )}
        >
          {status === "connected" ? "Live" : "Pending"}
        </span>
      </div>
      {metrics && metrics.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-black/25 px-2.5 py-2">
              <div className="text-[10px] text-slate-500">{m.label}</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-white tabular-nums">{m.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Connector not configured — using internal signals only.</p>
      )}
      {href && (
        <Link href={href} className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200">
          Configure <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function severityStyles(s: string) {
  if (s === "critical") return "border-rose-500/30 bg-rose-500/[0.07] text-rose-100";
  if (s === "high") return "border-amber-500/30 bg-amber-500/[0.07] text-amber-100";
  return "border-sky-500/25 bg-sky-500/[0.06] text-sky-100";
}

export function ListRow({
  href,
  primary,
  secondary,
  index,
}: {
  href: string;
  primary: string;
  secondary?: string;
  index?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition hover:border-white/[0.06] hover:bg-white/[0.03]"
    >
      {typeof index === "number" && (
        <span className="w-4 shrink-0 font-mono text-[10px] text-slate-600">{String(index + 1).padStart(2, "0")}</span>
      )}
      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300 group-hover:text-white">{primary}</span>
      {secondary && <span className="shrink-0 text-[10px] text-slate-500">{secondary}</span>}
    </Link>
  );
}
