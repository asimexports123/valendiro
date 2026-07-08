"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Play,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  FileText,
  Network,
  Rocket,
  Brain,
  Clock,
  XCircle,
  Download,
  ChevronDown,
} from "lucide-react";
import { downloadMissionControlReport } from "./_components/mission-control-report";
import {
  AutonomousLearningPanel,
  CEOBriefing,
  IntegrationsFooter,
  KnowledgeGrowthPanel,
  ProductionMonitoringPanel,
  QualityCommandCenter,
  RevenueCommandCenter,
  SearchConsolePanel,
} from "./_components/mission-control-sections";
import {
  DonutChart,
  fmt,
  GraphPreview,
  HealthRow,
  IntegrationSlot,
  ListRow,
  MetricTile,
  Panel,
  PanelHeader,
  PipelineFlow,
  QualityGauge,
  SectionEyebrow,
  severityStyles,
} from "./_components/dashboard-ui";

type MissionControl = Record<string, unknown> & {
  generatedAt: string;
  live: boolean;
  metrics: {
    topicsPublished: number;
    topicsDraft: number;
    topicsToday: number;
    packagesReady: number;
    packagesToday: number;
    entities: number;
    facts: number;
    citations: number;
    relationships: number;
    assetsPending: number;
    assetsAccepted: number;
    assetsError: number;
    assetsToday: number;
    renderedPublished: number;
    renderedToday: number;
    sourcesActive: number;
    sourcesPaused: number;
    queuePending: number;
    queueFailed: number;
    queueInProgress: number;
    qualityScore: number;
    qualityDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
      worldClass?: number;
      weak?: number;
      broken?: number;
      total: number;
    };
  };
  pipeline: { id: string; label: string; count: number; status: string; href: string }[];
  categories: { slug: string; name: string; topicCount: number; pct: number }[];
  sources: { id: string; name: string; url: string; status: string; type: string; lastFetched: string | null }[];
  thinTopics: { slug: string; title: string; words: number; factCount?: number; href?: string }[];
  strongTopics?: { slug: string; title: string; factCount: number; href: string }[];
  failedAssets: { id: string; title: string | null; reason: string | null; at: string }[];
  recentPublished: { id: string; slug: string; title: string; updatedAt: string }[];
  health: Record<string, string>;
  bottlenecks: { severity: string; title: string; why: string; action: string; href: string }[];
  activity: { id: string; type: string; message: string; at: string; href: string }[];
  ceoSummary: {
    headline: string;
    growthToday: { topics: number; packages: number; assets: number; publishedRenders: number };
    trustSignal: string;
    recommendedActions: { label: string; href: string; severity: string }[];
    improvedToday?: string[];
    failedToday?: string[];
    blocked?: string[];
    earning?: string;
    needsAttention?: string[];
  };
  workers: {
    updateQueuePending: number;
    updateQueueRunning: number;
    updateQueueFailed: number;
    crons: { path: string; schedule: string; purpose: string }[];
  };
  trust: { citationCount: number; lastVerifiedPackages: number };
  seo: { note: string; topicsIndexedEstimate: number; available: boolean };
  revenue: Record<string, unknown>;
  knowledgeGrowth?: Record<string, unknown>;
  searchConsole?: Record<string, unknown>;
  autonomousLearning?: Record<string, unknown>;
  productionMonitoring?: Record<string, unknown>;
  integrationsMissing?: string[];
  error?: string;
};

function timeAgo(iso: string, nowMs?: number) {
  const ms = (nowMs ?? Date.now()) - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86400_000) return `${Math.round(ms / 3600_000)}h ago`;
  return `${Math.round(ms / 86400_000)}d ago`;
}

const HEALTH_LABELS: Record<string, string> = {
  sources: "Discovery Sources",
  assets: "Asset Pipeline",
  queue: "Update Queue",
  packages: "Knowledge Packages",
  graph: "Knowledge Graph",
  publishing: "Publishing",
};

export default function DashboardPage() {
  const [data, setData] = useState<MissionControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const tick = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(tick);
  }, []);

  const ago = (iso: string) => (nowMs == null ? "—" : timeAgo(iso, nowMs));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/dashboard/mission-control", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const runLearner = async () => {
    setRunning(true);
    try {
      await fetch("/api/cron/autonomous-learner", { method: "POST" });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const downloadReport = async (format: "text" | "pdf" | "markdown" | "json") => {
    if (!data) return;
    setExportOpen(false);
    await downloadMissionControlReport(data, format);
  };

  if (loading && !data) {
    return (
      <div className="admin-dashboard-bg flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <p className="mt-4 text-sm text-slate-500">Loading mission telemetry…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="admin-dashboard-bg flex h-full items-center justify-center p-8">
        <Panel className="max-w-md p-6 text-center" accent="rose">
          <XCircle className="mx-auto h-8 w-8 text-rose-400" />
          <p className="mt-3 font-medium text-white">Mission Control unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={load} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
            Retry sync
          </button>
        </Panel>
      </div>
    );
  }

  const m = data!.metrics;
  const dist = m.qualityDistribution;
  const catColors = ["#8b5cf6", "#38bdf8", "#34d399", "#f472b6", "#fbbf24", "#a78bfa"];
  const topCats = data!.categories.slice(0, 6);
  const healthEntries = Object.entries(data!.health).filter(([k]) => !k.endsWith("Detail"));

  return (
    <div className="admin-dashboard-bg min-h-full text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#060a12]/90 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 lg:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[17px] font-semibold tracking-tight text-white">Mission Control</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Valendiro Knowledge OS · synced {data?.generatedAt ? ago(data.generatedAt) : "—"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-slate-300 transition hover:bg-white/[0.06]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                disabled={!data}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#0c1428] py-1 shadow-2xl">
                  {(["text", "pdf", "markdown", "json"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => downloadReport(f)}
                      className="block w-full px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-300 hover:bg-white/5"
                    >
                      {f === "markdown" ? "Markdown" : f.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={runLearner}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-[11px] font-medium text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run Learner
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-5 p-5 lg:p-6">
        <Panel accent="violet" className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <SectionEyebrow>Executive Summary</SectionEyebrow>
              <h2 className="text-[18px] font-semibold leading-snug tracking-tight text-white">{data!.ceoSummary.headline}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{data!.ceoSummary.trustSignal}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "Topics", value: data!.ceoSummary.growthToday.topics },
                  { label: "Packages", value: data!.ceoSummary.growthToday.packages },
                  { label: "Assets", value: data!.ceoSummary.growthToday.assets },
                  { label: "Publishes", value: data!.ceoSummary.growthToday.publishedRenders },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-lg border border-white/[0.07] bg-black/25 px-3 py-1.5 text-[11px]"
                  >
                    <span className="text-slate-500">{chip.label}</span>{" "}
                    <span className="font-mono font-semibold text-emerald-300">+{chip.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {data!.ceoSummary.recommendedActions.length > 0 && (
              <div className="w-full lg:w-[280px]">
                <SectionEyebrow>Priority Actions</SectionEyebrow>
                <div className="space-y-2">
                  {data!.ceoSummary.recommendedActions.map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-[11px] transition hover:brightness-110 ${severityStyles(a.severity)}`}
                    >
                      <span className="leading-snug">{a.label}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-60">{a.severity}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>

        {data!.ceoSummary.improvedToday && <CEOBriefing data={data as never} />}

        <RevenueCommandCenter data={data as never} />

        <section className="grid gap-4 xl:grid-cols-2">
          <SearchConsolePanel data={data as never} />
          <KnowledgeGrowthPanel data={data as never} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <AutonomousLearningPanel data={data as never} />
          <ProductionMonitoringPanel data={data as never} />
        </section>

        <QualityCommandCenter data={data as never} />

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricTile
            href="/admin/dashboard/articles"
            label="Published Topics"
            value={fmt(m.topicsPublished)}
            hint={{ text: `+${m.topicsToday} today`, positive: true }}
            icon={FileText}
            tone="blue"
          />
          <MetricTile
            href="/admin/dashboard/knowledge"
            label="Knowledge Packages"
            value={fmt(m.packagesReady)}
            hint={{ text: `+${m.packagesToday} today`, positive: true }}
            icon={Brain}
            tone="violet"
          />
          <MetricTile
            href="/admin/dashboard/knowledge"
            label="Entities"
            value={fmt(m.entities)}
            hint={{ text: `${fmt(m.relationships)} links` }}
            icon={Network}
            tone="fuchsia"
          />
          <MetricTile
            href="/admin/dashboard/knowledge"
            label="Facts"
            value={fmt(m.facts)}
            hint={{ text: `${fmt(m.citations)} citations` }}
            icon={Database}
            tone="emerald"
          />
          <MetricTile
            href="/admin/dashboard/publishing"
            label="Published Renders"
            value={fmt(m.renderedPublished)}
            hint={{ text: `+${m.renderedToday} today`, positive: true }}
            icon={Rocket}
            tone="sky"
          />
          <MetricTile
            href="/admin/dashboard/discovery"
            label="Assets Pending"
            value={fmt(m.assetsPending)}
            hint={
              m.assetsError > 0
                ? { text: `${m.assetsError} errors`, warn: true }
                : { text: `${m.assetsToday} new today`, positive: true }
            }
            icon={Layers}
            tone="amber"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <Panel className="p-5 xl:col-span-6">
            <PanelHeader title="Publishing Pipeline" subtitle="Live stage counts from production" href="/admin/dashboard/automation" action="Configure" />
            <PipelineFlow stages={data!.pipeline} />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Pending", value: m.queuePending },
                { label: "Running", value: m.queueInProgress },
                { label: "Failed", value: m.queueFailed, warn: m.queueFailed > 0 },
                { label: "Asset Errors", value: m.assetsError, warn: m.assetsError > 0 },
              ].map((q) => (
                <div key={q.label} className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{q.label}</div>
                  <div className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${q.warn ? "text-amber-300" : "text-white"}`}>
                    {fmt(q.value)}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-3">
            <PanelHeader title="Category Mix" subtitle="Share of published catalog" href="/admin/dashboard/categories" />
            <div className="flex items-center gap-4">
              <DonutChart segments={topCats.map((c, i) => ({ pct: c.pct, color: catColors[i % catColors.length], label: c.name }))} />
              <div className="min-w-0 flex-1 space-y-2">
                {topCats.map((c, i) => (
                  <div key={c.slug} className="flex items-center gap-2 text-[11px]">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: catColors[i % catColors.length] }} />
                    <span className="min-w-0 flex-1 truncate text-slate-300">{c.name}</span>
                    <span className="font-mono text-slate-500 tabular-nums">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-3">
            <PanelHeader title="Content Quality" subtitle="Package depth distribution" href="/admin/dashboard/quality" />
            <QualityGauge score={m.qualityScore} />
            <div className="mt-1 space-y-2">
              {[
                { label: "Excellent", n: dist.excellent, color: "bg-emerald-400" },
                { label: "Good", n: dist.good, color: "bg-violet-400" },
                { label: "Average", n: dist.average, color: "bg-sky-400" },
                { label: "Poor", n: dist.poor, color: "bg-rose-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-14 text-slate-500">{row.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/80">
                    <div className={`h-full ${row.color}`} style={{ width: `${Math.round((row.n / (dist.total || 1)) * 100)}%` }} />
                  </div>
                  <span className="w-7 text-right font-mono text-slate-500 tabular-nums">{row.n}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <Panel className="p-5 xl:col-span-4">
            <PanelHeader title="Recent Publications" subtitle="Latest topic updates" href="/admin/dashboard/articles" />
            <div className="divide-y divide-white/[0.04]">
              {data!.recentPublished.slice(0, 6).map((t, i) => (
                <ListRow key={t.id} href={`/en/topics/${t.slug}`} primary={t.title} secondary={ago(t.updatedAt)} index={i} />
              ))}
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-4">
            <PanelHeader title="Discovery & Trust" subtitle="Internal signals until analytics is wired" />
            <div className="space-y-3">
              <IntegrationSlot
                title="Search & Traffic"
                status={data!.seo.available ? "connected" : "pending"}
                metrics={[
                  { label: "Indexed Topics", value: fmt(data!.seo.available ? data!.seo.topicsIndexedEstimate : m.topicsPublished) },
                  { label: "Citations", value: fmt(m.citations) },
                ]}
                href="/admin/dashboard/seo"
              />
              <IntegrationSlot
                title="Revenue"
                status={(data!.revenue as { affiliate?: { available?: boolean } }).affiliate?.available ? "connected" : "pending"}
                metrics={[
                  { label: "Today", value: `$${(data!.revenue as { totalToday?: number }).totalToday ?? 0}` },
                  { label: "Month", value: `$${(data!.revenue as { totalMonth?: number }).totalMonth ?? 0}` },
                ]}
                href="/admin/dashboard/analytics"
              />
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-4">
            <PanelHeader title="Operational Activity" subtitle="Latest system events" href="/admin/dashboard/logs" />
            <div className="divide-y divide-white/[0.04]">
              {data!.activity.slice(0, 6).map((a, i) => (
                <ListRow key={a.id} href={a.href} primary={a.message} secondary={ago(a.at)} index={i} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <Panel className="p-5 xl:col-span-4">
            <PanelHeader title="Knowledge Graph" href="/admin/dashboard/knowledge" />
            <GraphPreview entities={m.entities} relationships={m.relationships} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                <div className="text-[10px] text-slate-500">Entities</div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums">{fmt(m.entities)}</div>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2">
                <div className="text-[10px] text-slate-500">Verified Packages</div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums">{fmt(data!.trust.lastVerifiedPackages)}</div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-4">
            <PanelHeader title="Source Feeds" subtitle={`${m.sourcesActive} active · ${m.sourcesPaused} paused`} href="/admin/dashboard/sources" />
            <div className="space-y-1.5">
              {data!.sources.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-black/15 px-3 py-2">
                  <span className="min-w-0 truncate text-[11px] text-slate-300">{s.name}</span>
                  <span className={`shrink-0 text-[10px] font-medium capitalize ${s.status === "active" ? "text-emerald-300" : "text-slate-500"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5 xl:col-span-4">
            <PanelHeader title="System Health" href="/admin/dashboard/system-health" />
            <div className="space-y-2">
              {healthEntries.map(([key, status]) => (
                <HealthRow
                  key={key}
                  label={HEALTH_LABELS[key] ?? key}
                  status={status}
                  detail={data!.health[`${key}Detail`]}
                />
              ))}
            </div>
          </Panel>
        </section>

        {data!.bottlenecks.length > 0 && (
          <Panel accent="amber" className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-[13px] font-semibold text-white">Active Bottlenecks</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {data!.bottlenecks.slice(0, 3).map((b) => (
                <Link key={b.title} href={b.href} className={`block rounded-xl border p-4 transition hover:brightness-110 ${severityStyles(b.severity)}`}>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.16em] opacity-70">{b.severity}</div>
                  <div className="mt-1.5 text-sm font-medium">{b.title}</div>
                  <p className="mt-1.5 text-[11px] leading-relaxed opacity-80">{b.why}</p>
                </Link>
              ))}
            </div>
          </Panel>
        )}

        {data!.failedAssets.length > 0 && (
          <Panel accent="rose" className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-400" />
              <h3 className="text-[13px] font-semibold text-white">Recent Asset Failures</h3>
            </div>
            <div className="space-y-2">
              {data!.failedAssets.map((f) => (
                <div key={f.id} className="rounded-xl border border-rose-500/15 bg-black/20 px-4 py-3">
                  <div className="text-[12px] font-medium text-rose-100">{f.title ?? f.id}</div>
                  <div className="mt-1 text-[11px] text-rose-200/70">{f.reason || "No rejection reason stored"}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{ago(f.at)}</div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <IntegrationsFooter missing={data!.integrationsMissing ?? []} />

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4 text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
            All metrics sourced from production database
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Auto-refresh 30s
          </div>
        </footer>
      </div>
    </div>
  );
}
