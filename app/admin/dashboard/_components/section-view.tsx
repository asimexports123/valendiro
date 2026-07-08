"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Database, Globe, Layers, Settings, Shield } from "lucide-react";
import { Panel, PanelHeader, SectionEyebrow, severityStyles } from "./dashboard-ui";

type MissionControl = {
  generatedAt: string;
  metrics: {
    topicsPublished: number;
    packagesReady: number;
    facts: number;
    citations: number;
    assetsPending: number;
    assetsError: number;
    renderedPublished: number;
    renderedToday: number;
    queuePending: number;
    queueFailed: number;
    queueInProgress: number;
    sourcesActive: number;
    qualityScore: number;
  };
  categories: { slug: string; name: string; topicCount: number; pct: number }[];
  sources: { id: string; name: string; status: string; type: string; lastFetched: string | null }[];
  bottlenecks: { severity: string; title: string; why: string; action: string; href: string }[];
  activity: { id: string; type: string; message: string; at: string; href: string }[];
};

const fmt = (n: number) => (n >= 1000 ? n.toLocaleString() : String(n));

export function SectionView({
  title,
  subtitle,
  metrics = [],
  links = [],
}: {
  title: string;
  subtitle: string;
  metrics: { label: string; value: (d: MissionControl) => string; icon?: "db" | "graph" | "activity" | "settings" | "shield" | "globe" }[];
  links: { label: string; href: string }[];
}) {
  const [data, setData] = useState<MissionControl | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/dashboard/mission-control", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setData(json);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const iconFor = (icon?: "db" | "graph" | "activity" | "settings" | "shield" | "globe") => {
    if (icon === "graph") return Layers;
    if (icon === "activity") return Activity;
    if (icon === "settings") return Settings;
    if (icon === "shield") return Shield;
    if (icon === "globe") return Globe;
    return Database;
  };

  const topCategories = useMemo(() => (data?.categories ?? []).slice(0, 6), [data]);
  const topSources = useMemo(() => (data?.sources ?? []).slice(0, 8), [data]);
  const topActivity = useMemo(() => (data?.activity ?? []).slice(0, 8), [data]);

  return (
    <div className="admin-dashboard-bg min-h-full p-5 text-slate-100 lg:p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionEyebrow>Admin Console</SectionEyebrow>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-400">{subtitle}</p>
            <p className="mt-2 text-[11px] text-slate-600">
              {loading ? "Syncing live data…" : `Last sync ${data?.generatedAt ?? "now"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-slate-300 transition hover:bg-white/[0.06]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((m, i) => {
            const Icon = iconFor(m.icon);
            const tones = [
              "from-violet-500/15 to-indigo-500/5 border-violet-400/15",
              "from-sky-500/15 to-cyan-500/5 border-sky-400/15",
              "from-emerald-500/15 to-teal-500/5 border-emerald-400/15",
              "from-amber-500/15 to-orange-500/5 border-amber-400/15",
            ];
            return (
              <div
                key={m.label}
                className={`rounded-2xl border bg-gradient-to-br ${tones[i % tones.length]} p-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{m.label}</div>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
                  {data ? m.value(data) : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="p-4">
            <PanelHeader title="Top Categories" />
            <div className="space-y-1.5">
              {topCategories.map((c) => (
                <div key={c.slug} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-black/15 px-3 py-2 text-[11px]">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="font-mono text-slate-500 tabular-nums">{fmt(c.topicCount)} · {c.pct}%</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <PanelHeader title="Sources" />
            <div className="space-y-1.5">
              {topSources.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-black/15 px-3 py-2 text-[11px]">
                  <span className="truncate text-slate-300">{s.name}</span>
                  <span className={s.status === "active" ? "text-emerald-300" : "text-slate-500"}>{s.status}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <PanelHeader title="Hot Alerts" />
            <div className="space-y-2">
              {(data?.bottlenecks ?? []).slice(0, 4).map((b) => (
                <Link
                  key={b.title}
                  href={b.href}
                  className={`block rounded-xl border px-3 py-2.5 text-[11px] transition hover:brightness-110 ${severityStyles(b.severity)}`}
                >
                  <div className="font-medium">{b.title}</div>
                  <div className="mt-1 line-clamp-2 opacity-75">{b.why}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold text-white">Recent Activity</h3>
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200">
              Mission Control <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topActivity.map((a) => (
              <Link key={a.id} href={a.href} className="block px-1 py-2.5 text-[11px] text-slate-300 hover:text-white">
                {a.message}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export const sectionPresets = {
  analytics: {
    title: "Analytics",
    subtitle: "Live growth, throughput, quality and operational telemetry.",
    metrics: [
      { label: "Published Topics", value: (d: MissionControl) => fmt(d.metrics.topicsPublished), icon: "graph" as const },
      { label: "Packages", value: (d: MissionControl) => fmt(d.metrics.packagesReady), icon: "db" as const },
      { label: "Facts", value: (d: MissionControl) => fmt(d.metrics.facts), icon: "db" as const },
      { label: "Quality", value: (d: MissionControl) => `${d.metrics.qualityScore}/100`, icon: "activity" as const },
    ],
    links: [{ label: "Open Dashboard", href: "/admin/dashboard" }],
  },
  categories: {
    title: "Categories",
    subtitle: "Coverage distribution and catalog concentration by category.",
    metrics: [
      { label: "Topics", value: (d: MissionControl) => fmt(d.metrics.topicsPublished), icon: "graph" as const },
      { label: "Sources Active", value: (d: MissionControl) => fmt(d.metrics.sourcesActive), icon: "activity" as const },
      { label: "Assets Pending", value: (d: MissionControl) => fmt(d.metrics.assetsPending), icon: "db" as const },
      { label: "Queue Failed", value: (d: MissionControl) => fmt(d.metrics.queueFailed), icon: "settings" as const },
    ],
    links: [{ label: "Topics", href: "/admin/dashboard/articles" }],
  },
  sources: {
    title: "Sources",
    subtitle: "Ingestion source health, activity, and reliability signal.",
    metrics: [
      { label: "Active Sources", value: (d: MissionControl) => fmt(d.metrics.sourcesActive), icon: "activity" as const },
      { label: "Assets Pending", value: (d: MissionControl) => fmt(d.metrics.assetsPending), icon: "db" as const },
      { label: "Asset Errors", value: (d: MissionControl) => fmt(d.metrics.assetsError), icon: "settings" as const },
      { label: "Queue Pending", value: (d: MissionControl) => fmt(d.metrics.queuePending), icon: "graph" as const },
    ],
    links: [{ label: "Discovery", href: "/admin/dashboard/discovery" }],
  },
  rendering: {
    title: "Rendering",
    subtitle: "Render throughput and publication readiness.",
    metrics: [
      { label: "Published Renders", value: (d: MissionControl) => fmt(d.metrics.renderedPublished), icon: "db" as const },
      { label: "Published Today", value: (d: MissionControl) => fmt(d.metrics.renderedToday), icon: "activity" as const },
      { label: "Queue Running", value: (d: MissionControl) => fmt(d.metrics.queueInProgress), icon: "graph" as const },
      { label: "Queue Failed", value: (d: MissionControl) => fmt(d.metrics.queueFailed), icon: "settings" as const },
    ],
    links: [{ label: "Publishing", href: "/admin/dashboard/publishing" }],
  },
  publishing: {
    title: "Publishing",
    subtitle: "Publication output, queue state, and quality gate confidence.",
    metrics: [
      { label: "Published", value: (d: MissionControl) => fmt(d.metrics.renderedPublished), icon: "db" as const },
      { label: "Today", value: (d: MissionControl) => fmt(d.metrics.renderedToday), icon: "activity" as const },
      { label: "Citations", value: (d: MissionControl) => fmt(d.metrics.citations), icon: "shield" as const },
      { label: "Quality", value: (d: MissionControl) => `${d.metrics.qualityScore}/100`, icon: "graph" as const },
    ],
    links: [{ label: "Mission Control", href: "/admin/dashboard" }],
  },
  quality: {
    title: "Quality",
    subtitle: "Quality score and trust signal across packages.",
    metrics: [
      { label: "Quality Score", value: (d: MissionControl) => `${d.metrics.qualityScore}/100`, icon: "shield" as const },
      { label: "Facts", value: (d: MissionControl) => fmt(d.metrics.facts), icon: "db" as const },
      { label: "Citations", value: (d: MissionControl) => fmt(d.metrics.citations), icon: "activity" as const },
      { label: "Packages", value: (d: MissionControl) => fmt(d.metrics.packagesReady), icon: "graph" as const },
    ],
    links: [{ label: "System Health", href: "/admin/dashboard/system-health" }],
  },
  seo: {
    title: "SEO",
    subtitle: "Indexability and discoverability snapshot from live catalog data.",
    metrics: [
      { label: "Topics", value: (d: MissionControl) => fmt(d.metrics.topicsPublished), icon: "globe" as const },
      { label: "Facts", value: (d: MissionControl) => fmt(d.metrics.facts), icon: "db" as const },
      { label: "Citations", value: (d: MissionControl) => fmt(d.metrics.citations), icon: "activity" as const },
      { label: "Queue Pending", value: (d: MissionControl) => fmt(d.metrics.queuePending), icon: "settings" as const },
    ],
    links: [{ label: "Categories", href: "/admin/dashboard/categories" }],
  },
  internalLinks: {
    title: "Internal Links",
    subtitle: "Topic graph adjacency and linking opportunities.",
    metrics: [
      { label: "Topics", value: (d: MissionControl) => fmt(d.metrics.topicsPublished), icon: "graph" as const },
      { label: "Packages", value: (d: MissionControl) => fmt(d.metrics.packagesReady), icon: "db" as const },
      { label: "Queue Failed", value: (d: MissionControl) => fmt(d.metrics.queueFailed), icon: "settings" as const },
      { label: "Sources", value: (d: MissionControl) => fmt(d.metrics.sourcesActive), icon: "activity" as const },
    ],
    links: [{ label: "Mission Control", href: "/admin/dashboard" }],
  },
  logs: {
    title: "Logs",
    subtitle: "Recent operational signals from queue, sources, and pipeline.",
    metrics: [
      { label: "Queue Pending", value: (d: MissionControl) => fmt(d.metrics.queuePending), icon: "settings" as const },
      { label: "Queue Failed", value: (d: MissionControl) => fmt(d.metrics.queueFailed), icon: "settings" as const },
      { label: "Assets Pending", value: (d: MissionControl) => fmt(d.metrics.assetsPending), icon: "db" as const },
      { label: "Asset Errors", value: (d: MissionControl) => fmt(d.metrics.assetsError), icon: "activity" as const },
    ],
    links: [{ label: "System Health", href: "/admin/dashboard/system-health" }],
  },
  settings: {
    title: "Settings",
    subtitle: "Operational controls for pipeline, quality, and automation loops.",
    metrics: [
      { label: "Sources", value: (d: MissionControl) => fmt(d.metrics.sourcesActive), icon: "settings" as const },
      { label: "Queue Running", value: (d: MissionControl) => fmt(d.metrics.queueInProgress), icon: "activity" as const },
      { label: "Queue Failed", value: (d: MissionControl) => fmt(d.metrics.queueFailed), icon: "settings" as const },
      { label: "Quality", value: (d: MissionControl) => `${d.metrics.qualityScore}/100`, icon: "shield" as const },
    ],
    links: [{ label: "Automation", href: "/admin/dashboard/automation" }],
  },
} as const;

