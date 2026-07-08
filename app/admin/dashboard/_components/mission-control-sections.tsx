"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  DollarSign,
  Globe,
  Loader2,
  Network,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Server,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { fmt, GraphPreview, Panel, PanelHeader, SectionEyebrow, severityStyles } from "./dashboard-ui";

export type MissionControlData = {
  ceoSummary: {
    improvedToday: string[];
    failedToday: string[];
    blocked: string[];
    earning: string;
    needsAttention: string[];
    businessImpact?: {
      packagesDelayed: number;
      publicationsDelayed: number;
      trafficImpact: string;
      revenueImpact: string;
      queueFailures: number;
      assetFailures: number;
    };
  };
  knowledgeGrowth: {
    factsToday: number;
    entitiesToday: number;
    relationshipsToday: number;
    packagesUpgradedToday: number;
    packagesCreatedToday: number;
    topicsImprovedToday: number;
    topicsRejectedToday: number;
    knowledgeAccumulated: number;
    awaitingEnrichment: number;
    factTrend?: number[];
    richnessTrend?: number;
    avgFactsPerPackage?: number;
    href: string;
  };
  revenue: {
    missingIntegrations: string[];
    totalToday: number;
    totalWeek: number;
    totalMonth: number;
    projectedMonthly?: number;
    rpm?: number;
    affiliate: {
      clicksToday: number;
      conversionsToday: number;
      epc: number;
      ctr: number;
      topProducts: { productId: string; revenue: number; href: string }[];
      revenuePerCategory: { category: string; slug: string; topics: number; href: string }[];
      href: string;
    };
    ads: { available: boolean; missingIntegration: string; href: string };
  };
  searchConsole: {
    connected: boolean;
    missingIntegration: string | null;
    indexedPages: number;
    pagesDiscovered: number;
    pagesCrawled: number;
    pagesNotIndexed: number;
    impressions: number;
    clicks: number;
    ctr: number;
    averagePosition: number;
    topWinners: { keyword: string; score: number; href: string }[];
    coverageErrors: string[];
    href: string;
  };
  trafficCommandCenter?: {
    searchConsole: MissionControlData["searchConsole"];
    googleAnalytics: { connected: boolean; status: string; missingIntegration: string; href: string };
    bingWebmaster: { connected: boolean; status: string; missingIntegration: string; href: string };
    cloudflare: { connected: boolean; status: string; missingIntegration: string; href: string };
  };
  autonomousLearning: {
    status: string;
    currentTopic: string | null;
    currentSource: string | null;
    currentStage: string | null;
    queueDepth: number;
    nextTopic: string | null;
    lastRunAt: string | null;
    lastRunStatus: string | null;
    href: string;
  };
  productionMonitoring: {
    crons: { path: string; schedule: string; purpose: string; lastRun: string | null; status: string; href: string }[];
    database: { status: string; latencyMs: number; href: string };
    workers: { pending: number; running: number; failed: number; href: string };
    platform: { note: string };
    responseTimeMs: number;
    errors: number;
    warnings: number;
    href: string;
  };
  metrics: {
    qualityDistribution: {
      worldClass: number;
      good: number;
      average: number;
      weak: number;
      broken: number;
    };
  };
  thinTopics: { slug: string; title: string; factCount?: number; href: string }[];
  strongTopics: { slug: string; title: string; factCount: number; href: string }[];
  closestToWorldClass?: { slug: string; title: string; factCount: number; factsNeeded: number; href: string }[];
  needingEnrichment?: { slug: string; title: string; factCount: number; href: string }[];
  bottlenecks: {
    severity: string;
    title: string;
    why: string;
    action: string;
    href: string;
    rootCause: string;
    businessImpact: string;
    publishingImpact: string;
    estimatedImprovement: string;
    recommendedAction: string;
    operation?: string;
  }[];
  aiRecommendations?: { text: string; severity: string; href: string }[];
  operations?: { automationEnabled: boolean; href: string };
  failedQueueItems?: { id: string; type: string; label: string; error: string | null; at: string; href: string }[];
  knowledgeGraph?: {
    entities: number;
    relationships: number;
    entitiesToday: number;
    growthPct: number;
    mostConnected: { slug: string; name: string; connections: number; href: string }[];
    fastestGrowing: { slug: string; name: string; connections: number; href: string }[];
    clusters: { type: string; count: number }[];
    href: string;
  };
  integrationsStatus?: { name: string; status: string; detail: string; href: string }[];
  integrationsMissing: string[];
};

function StatCell({ label, value, href }: { label: string; value: string | number | null; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-base font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition hover:brightness-110">
        {inner}
      </Link>
    );
  }
  return inner;
}

function MissingBadge({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] text-amber-100/90">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}

export function CEOBriefing({ data }: { data: MissionControlData }) {
  const s = data.ceoSummary;
  const bi = s.businessImpact;
  return (
    <Panel accent="violet" className="p-5">
      <SectionEyebrow>CEO Briefing — Business Impact</SectionEyebrow>
      {bi && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCell label="Packages Delayed" value={bi.packagesDelayed} href="/admin/dashboard/system-health" />
          <StatCell label="Publications Delayed" value={bi.publicationsDelayed} href="/admin/dashboard/publishing" />
          <StatCell label="Queue Failures" value={bi.queueFailures} href="/admin/dashboard/system-health" />
          <StatCell label="Asset Failures" value={bi.assetFailures} href="/admin/dashboard/discovery" />
        </div>
      )}
      {bi && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-[11px] text-slate-300">
            <span className="text-slate-500">Traffic impact: </span>{bi.trafficImpact}
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-[11px] text-slate-300">
            <span className="text-slate-500">Revenue impact: </span>{bi.revenueImpact}
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <div className="mb-2 text-[11px] font-medium text-emerald-300">Improved</div>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {s.improvedToday.length ? s.improvedToday.map((x) => <li key={x}>• {x}</li>) : <li className="text-slate-500">No major improvements yet today</li>}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-medium text-rose-300">Failed / At risk</div>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {s.failedToday.length ? s.failedToday.map((x) => <li key={x}>• {x}</li>) : <li className="text-slate-500">No new failures today</li>}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-medium text-amber-300">Blocked / Earning / Attention</div>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {s.blocked.map((x) => (
              <li key={x}>⛔ {x}</li>
            ))}
            <li>💰 {s.earning}</li>
            {s.needsAttention.map((x) => (
              <li key={x}>👁 {x}</li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

export function RevenueCommandCenter({ data }: { data: MissionControlData }) {
  const r = data.revenue;
  return (
    <Panel accent="emerald" className="p-5">
      <PanelHeader title="Revenue Command Center" subtitle="Live affiliate data from production DB" href={r.affiliate.href} action="Analytics" />
      {r.missingIntegrations.length > 0 && (
        <div className="mb-4 space-y-2">
          {r.missingIntegrations.map((m) => (
            <MissingBadge key={m} text={`Missing: ${m}`} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <StatCell label="Total Today" value={`$${r.totalToday}`} href={r.affiliate.href} />
        <StatCell label="This Week" value={`$${r.totalWeek}`} href={r.affiliate.href} />
        <StatCell label="This Month" value={`$${r.totalMonth}`} href={r.affiliate.href} />
        <StatCell label="Clicks Today" value={fmt(r.affiliate.clicksToday)} href={r.affiliate.href} />
        <StatCell label="Conversions" value={r.affiliate.conversionsToday} href={r.affiliate.href} />
        <StatCell label="EPC" value={`$${r.affiliate.epc}`} href={r.affiliate.href} />
        <StatCell label="CTR" value={`${r.affiliate.ctr}%`} href={r.affiliate.href} />
        <StatCell label="Projected Monthly" value={`$${r.projectedMonthly ?? 0}`} href={r.affiliate.href} />
        <StatCell label="RPM" value={r.rpm ? `$${r.rpm}` : "—"} href={r.affiliate.href} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Top Products</div>
          <div className="space-y-1">
            {r.affiliate.topProducts.length ? (
              r.affiliate.topProducts.map((p) => (
                <Link key={p.productId} href={p.href} className="flex justify-between rounded-lg bg-black/20 px-3 py-2 text-[11px] hover:bg-black/30">
                  <span className="truncate text-slate-300">{p.productId}</span>
                  <span className="font-mono text-emerald-300">${p.revenue}</span>
                </Link>
              ))
            ) : (
              <div className="text-[11px] text-slate-500">No affiliate conversions recorded yet — table live, awaiting traffic.</div>
            )}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Revenue by Category (catalog proxy)</div>
          <div className="space-y-1">
            {r.affiliate.revenuePerCategory.map((c) => (
              <Link key={c.slug} href={c.href} className="flex justify-between rounded-lg bg-black/20 px-3 py-2 text-[11px] hover:bg-black/30">
                <span className="text-slate-300">{c.category}</span>
                <span className="text-slate-500">{c.topics} topics</span>
              </Link>
            ))}
          </div>
          {!r.ads.available && (
            <div className="mt-3">
              <MissingBadge text={r.ads.missingIntegration} />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function SearchConsolePanel({ data }: { data: MissionControlData }) {
  const g = data.searchConsole;
  return (
    <Panel className="p-5">
      <PanelHeader title="Google Search Console" subtitle={g.connected ? "Partial signals from demand_signals" : "API not connected"} href={g.href} action="SEO" />
      {!g.connected && g.missingIntegration && <MissingBadge text={g.missingIntegration} />}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="Indexed Pages" value={fmt(g.indexedPages)} href={g.href} />
        <StatCell label="Discovered" value={fmt(g.pagesDiscovered)} href={g.href} />
        <StatCell label="Crawled" value={fmt(g.pagesCrawled)} href={g.href} />
        <StatCell label="Not Indexed" value={fmt(g.pagesNotIndexed)} href={g.href} />
        <StatCell label="Impressions" value={g.connected ? fmt(g.impressions) : "—"} href={g.href} />
        <StatCell label="Clicks" value={g.connected ? fmt(g.clicks) : "—"} href={g.href} />
        <StatCell label="CTR" value={g.connected ? `${g.ctr}%` : "—"} href={g.href} />
        <StatCell label="Avg Position" value={g.connected ? g.averagePosition : "—"} href={g.href} />
      </div>
      {g.topWinners.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Top Opportunities (GSC signals)</div>
          {g.topWinners.map((w) => (
            <Link key={w.keyword} href={w.href} className="flex justify-between rounded-lg bg-black/15 px-3 py-2 text-[11px] hover:bg-black/25">
              <span className="truncate text-slate-300">{w.keyword}</span>
              <span className="text-violet-300">{w.score}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function KnowledgeFactoryHero({ data }: { data: MissionControlData }) {
  const k = data.knowledgeGrowth;
  const maxTrend = Math.max(...(k.factTrend ?? [1]), 1);
  return (
    <Panel accent="sky" className="p-5">
      <PanelHeader title="Knowledge Factory" subtitle="Live production knowledge accumulation" href={k.href} action="Inspect" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <StatCell label="Facts Today" value={fmt(k.factsToday)} href={k.href} />
        <StatCell label="Entities Today" value={fmt(k.entitiesToday)} href={k.href} />
        <StatCell label="Relationships Today" value={fmt(k.relationshipsToday)} href={k.href} />
        <StatCell label="Packages Improved" value={fmt(k.packagesUpgradedToday)} href={k.href} />
        <StatCell label="Topics Upgraded" value={fmt(k.topicsImprovedToday)} href="/admin/dashboard/publishing" />
        <StatCell label="Topics Rejected" value={fmt(k.topicsRejectedToday)} href="/admin/dashboard/discovery" />
        <StatCell label="Knowledge Total" value={fmt(k.knowledgeAccumulated)} href={k.href} />
        <StatCell label="Avg Facts/Package" value={k.avgFactsPerPackage ?? "—"} href="/admin/dashboard/quality" />
      </div>
      {(k.factTrend?.length ?? 0) > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">7-day knowledge growth trend</div>
          <div className="flex h-16 items-end gap-1">
            {k.factTrend!.map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-sky-500/40" style={{ height: `${Math.max(8, (v / maxTrend) * 100)}%` }} title={`${v} facts`} />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

export function KnowledgeGrowthPanel({ data }: { data: MissionControlData }) {
  return <KnowledgeFactoryHero data={data} />;
}

export function AutonomousLearningPanel({ data }: { data: MissionControlData }) {
  const a = data.autonomousLearning;
  return (
    <Panel accent="violet" className="p-5">
      <PanelHeader title="Autonomous Learning" subtitle="Real-time learner state" href={a.href} action="Manage" />
      <div className="mb-4 flex items-center gap-2">
        <Radio className={`h-4 w-4 ${a.status === "running" ? "text-sky-400 animate-pulse" : "text-slate-500"}`} />
        <span className="text-sm font-medium capitalize text-white">{a.status}</span>
        {a.lastRunAt && (
          <span className="text-[11px] text-slate-500">Last run {new Date(a.lastRunAt).toLocaleString()}</span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <StatCell label="Current Topic" value={a.currentTopic ?? "—"} href={a.currentTopic ? `/en/topics/${a.currentTopic}` : a.href} />
        <StatCell label="Next Topic" value={a.nextTopic ?? "—"} href={a.nextTopic ? `/en/topics/${a.nextTopic}` : a.href} />
        <StatCell label="Current Source" value={a.currentSource ? String(a.currentSource).slice(0, 40) : "—"} href={a.href} />
        <StatCell label="Current Stage" value={a.currentStage ?? "—"} href={a.href} />
        <StatCell label="Queue Depth" value={fmt(a.queueDepth)} href="/admin/dashboard/system-health" />
        <StatCell label="Last Status" value={a.lastRunStatus ?? "—"} href={a.href} />
      </div>
    </Panel>
  );
}

export function ProductionMonitoringPanel({ data }: { data: MissionControlData }) {
  const p = data.productionMonitoring;
  return (
    <Panel className="p-5">
      <PanelHeader title="Production Monitoring" subtitle="Database, queues, crons — live" href={p.href} action="System Health" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="DB Latency" value={`${p.database.latencyMs}ms`} href={p.database.href} />
        <StatCell label="Response Time" value={`${p.responseTimeMs}ms`} href={p.href} />
        <StatCell label="Errors" value={fmt(p.errors)} href="/admin/dashboard/logs" />
        <StatCell label="Warnings" value={fmt(p.warnings)} href={p.href} />
        <StatCell label="Queue Pending" value={fmt(p.workers.pending)} href={p.workers.href} />
        <StatCell label="Queue Running" value={fmt(p.workers.running)} href={p.workers.href} />
        <StatCell label="Queue Failed" value={fmt(p.workers.failed)} href={p.workers.href} />
        <StatCell label="DB Status" value={p.database.status} href={p.database.href} />
      </div>
      <div className="mt-4 space-y-2">
        {p.crons.map((c) => (
          <Link key={c.path} href={c.href} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/15 px-3 py-2 text-[11px] hover:bg-black/25">
            <div>
              <div className="font-medium text-slate-300">{c.purpose}</div>
              <div className="text-slate-500">{c.path} · {c.schedule}</div>
            </div>
            <div className="text-right">
              <div className="capitalize text-slate-400">{c.status}</div>
              <div className="text-slate-600">{c.lastRun ? new Date(c.lastRun).toLocaleString() : "Never"}</div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-600">{p.platform.note}</p>
    </Panel>
  );
}

export function QualityCommandCenter({ data }: { data: MissionControlData }) {
  const q = data.metrics.qualityDistribution;
  return (
    <Panel className="p-5">
      <PanelHeader title="Knowledge Quality Command" subtitle="Actionable package depth tiers — live" href="/admin/dashboard/quality" action="Inspect" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCell label="World Class" value={q.worldClass} href="/admin/dashboard/quality" />
        <StatCell label="Good" value={q.good} href="/admin/dashboard/quality" />
        <StatCell label="Average" value={q.average} href="/admin/dashboard/quality" />
        <StatCell label="Weak" value={q.weak} href="/admin/dashboard/quality" />
        <StatCell label="Broken" value={q.broken} href="/admin/dashboard/quality" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <TopicList title="Top 20 Weakest" icon={Brain} topics={data.thinTopics} valueKey="factCount" valueClass="text-rose-300" suffix=" facts" />
        <TopicList title="Top 20 Strongest" icon={TrendingUp} topics={data.strongTopics} valueKey="factCount" valueClass="text-emerald-300" suffix=" facts" />
        <TopicList
          title="Closest to World Class"
          icon={Sparkles}
          topics={(data.closestToWorldClass ?? []).map((t) => ({ ...t, factCount: t.factsNeeded }))}
          valueKey="factCount"
          valueClass="text-violet-300"
          suffix=" needed"
        />
        <TopicList title="Needs Enrichment Now" icon={AlertTriangle} topics={data.needingEnrichment ?? []} valueKey="factCount" valueClass="text-amber-300" suffix=" facts" />
      </div>
    </Panel>
  );
}

function TopicList({
  title,
  icon: Icon,
  topics,
  valueKey,
  valueClass,
  suffix,
}: {
  title: string;
  icon: LucideIcon;
  topics: { slug: string; title: string; href: string; factCount?: number }[];
  valueKey: string;
  valueClass: string;
  suffix: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3" /> {title}
      </div>
      <div className="max-h-64 space-y-0.5 overflow-y-auto">
        {topics.length ? (
          topics.map((t) => (
            <Link key={t.slug} href={t.href} className="flex justify-between rounded-lg px-2 py-1.5 text-[11px] hover:bg-white/[0.03]">
              <span className="truncate text-slate-300">{t.title}</span>
              <span className={`shrink-0 ${valueClass}`}>{(t as Record<string, number>)[valueKey]}{suffix}</span>
            </Link>
          ))
        ) : (
          <div className="text-[11px] text-slate-500">None in this tier</div>
        )}
      </div>
    </div>
  );
}

export function IntegrationsFooter({ missing }: { missing: string[] }) {
  if (!missing.length) return null;
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <Globe className="h-3.5 w-3.5" />
        <span>Production integrations still missing:</span>
        <span className="text-slate-300">{missing.join(" · ")}</span>
        <Link href="/admin/dashboard/settings" className="ml-auto inline-flex items-center gap-1 text-violet-300 hover:text-violet-200">
          Configure <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </Panel>
  );
}

const integrationStatusColors: Record<string, string> = {
  connected: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  missing: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  configuration_required: "border-amber-500/25 bg-amber-500/10 text-amber-300",
};

export function BottlenecksHero({ bottlenecks }: { bottlenecks: MissionControlData["bottlenecks"] }) {
  if (!bottlenecks.length) return null;
  return (
    <Panel accent="amber" className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h3 className="text-[13px] font-semibold text-white">Current Bottleneck — Operational Priority</h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {bottlenecks.slice(0, 3).map((b) => (
          <div key={b.title} className={`rounded-xl border p-4 ${severityStyles(b.severity)}`}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] opacity-70">{b.severity}</div>
            <div className="mt-1.5 text-sm font-medium">{b.title}</div>
            <dl className="mt-3 space-y-1.5 text-[10px] leading-relaxed opacity-90">
              <div><dt className="inline font-medium">Root cause: </dt><dd className="inline">{b.rootCause}</dd></div>
              <div><dt className="inline font-medium">Business impact: </dt><dd className="inline">{b.businessImpact}</dd></div>
              <div><dt className="inline font-medium">Publishing impact: </dt><dd className="inline">{b.publishingImpact}</dd></div>
              <div><dt className="inline font-medium">Est. improvement: </dt><dd className="inline">{b.estimatedImprovement}</dd></div>
            </dl>
            <Link href={b.href} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium underline opacity-90 hover:opacity-100">
              {b.recommendedAction} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function OperationsBar({
  automationEnabled,
  onAction,
  running,
  failedAsset,
  failedQueue,
}: {
  automationEnabled: boolean;
  onAction: (action: string) => void;
  running: string | null;
  failedAsset?: { id: string; title: string | null; href: string };
  failedQueue?: { id: string; label: string; href: string };
}) {
  const ops = [
    { action: "run_discovery", label: "Run Discovery", icon: Globe },
    { action: "run_learner", label: "Run Learner", icon: Brain },
    { action: "retry_failed_assets", label: "Retry Assets", icon: RefreshCw },
    { action: "retry_failed_jobs", label: "Retry Jobs", icon: Zap },
    { action: "drain_queue", label: "Drain Queue", icon: Server },
    automationEnabled
      ? { action: "pause_automation", label: "Pause Automation", icon: Pause }
      : { action: "resume_automation", label: "Resume Automation", icon: Play },
  ];
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionEyebrow>One-Click Operations</SectionEyebrow>
        <span className={`text-[10px] font-medium ${automationEnabled ? "text-emerald-300" : "text-amber-300"}`}>
          Automation {automationEnabled ? "ON" : "PAUSED"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ops.map((op) => (
          <button
            key={op.action}
            type="button"
            disabled={!!running}
            onClick={() => onAction(op.action)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {running === op.action ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <op.icon className="h-3.5 w-3.5" />}
            {op.label}
          </button>
        ))}
        {failedAsset && (
          <Link href={failedAsset.href} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
            Open Failed Asset
          </Link>
        )}
        {failedQueue && (
          <Link href={failedQueue.href} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
            Open Failed Job: {failedQueue.label}
          </Link>
        )}
      </div>
    </Panel>
  );
}

export function TrafficCommandCenter({ data }: { data: MissionControlData }) {
  const t = data.trafficCommandCenter;
  const g = t?.searchConsole ?? data.searchConsole;
  return (
    <Panel className="p-5 xl:col-span-2">
      <PanelHeader title="Traffic Command Center" subtitle="Search, analytics, and edge — production status" href={g.href} action="SEO" />
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        {[t?.googleAnalytics, t?.bingWebmaster, t?.cloudflare].filter(Boolean).map((src) => (
          <div key={src!.missingIntegration} className={`rounded-lg border px-3 py-2 text-[10px] ${integrationStatusColors[src!.status] ?? integrationStatusColors.missing}`}>
            <div className="font-medium capitalize">{src!.status.replace("_", " ")}</div>
            <div className="mt-1 opacity-80">{src!.missingIntegration}</div>
          </div>
        ))}
      </div>
      {!g.connected && g.missingIntegration && <MissingBadge text={g.missingIntegration} />}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="Indexed Pages" value={fmt(g.indexedPages)} href={g.href} />
        <StatCell label="Discovered" value={fmt(g.pagesDiscovered)} href={g.href} />
        <StatCell label="Crawled" value={fmt(g.pagesCrawled)} href={g.href} />
        <StatCell label="Not Indexed" value={fmt(g.pagesNotIndexed)} href={g.href} />
        <StatCell label="Impressions" value={g.connected ? fmt(g.impressions) : "—"} href={g.href} />
        <StatCell label="Clicks" value={g.connected ? fmt(g.clicks) : "—"} href={g.href} />
        <StatCell label="CTR" value={g.connected ? `${g.ctr}%` : "—"} href={g.href} />
        <StatCell label="Avg Position" value={g.connected ? g.averagePosition : "—"} href={g.href} />
      </div>
      {g.topWinners.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Top Opportunities</div>
          {g.topWinners.map((w) => (
            <Link key={w.keyword} href={w.href} className="flex justify-between rounded-lg bg-black/15 px-3 py-2 text-[11px] hover:bg-black/25">
              <span className="truncate text-slate-300">{w.keyword}</span>
              <span className="text-violet-300">{w.score}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function AIRecommendationsPanel({ recommendations }: { recommendations: NonNullable<MissionControlData["aiRecommendations"]> }) {
  if (!recommendations.length) return null;
  return (
    <Panel accent="violet" className="p-5">
      <PanelHeader title="AI Recommendations" subtitle="Generated from live production data" href="/admin/dashboard/quality" />
      <div className="space-y-2">
        {recommendations.map((r) => (
          <Link key={r.text} href={r.href} className={`flex items-start gap-2 rounded-xl border p-3 text-[11px] transition hover:brightness-110 ${severityStyles(r.severity === "info" ? "medium" : r.severity)}`}>
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{r.text}</span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function KnowledgeGraphPanel({ graph }: { graph: NonNullable<MissionControlData["knowledgeGraph"]> }) {
  return (
    <Panel className="p-5">
      <PanelHeader title="Knowledge Graph" subtitle="Entities, relationships, clusters — live" href={graph.href} action="Explore" />
      <GraphPreview entities={graph.entities} relationships={graph.relationships} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatCell label="Entities" value={fmt(graph.entities)} href={graph.href} />
        <StatCell label="Added Today" value={fmt(graph.entitiesToday)} href={graph.href} />
        <StatCell label="Growth Today" value={`${graph.growthPct}%`} href={graph.href} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-1 text-[10px] uppercase text-slate-500"><Network className="h-3 w-3" /> Most Connected</div>
          {graph.mostConnected.slice(0, 6).map((e) => (
            <Link key={e.slug} href={e.href} className="flex justify-between py-1 text-[11px] hover:text-violet-300">
              <span className="truncate">{e.name}</span>
              <span className="text-slate-500">{e.connections}</span>
            </Link>
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-[10px] uppercase text-slate-500"><TrendingUp className="h-3 w-3" /> Fastest Growing Today</div>
          {graph.fastestGrowing.length ? graph.fastestGrowing.map((e) => (
            <Link key={e.slug} href={e.href} className="flex justify-between py-1 text-[11px] hover:text-violet-300">
              <span className="truncate">{e.name}</span>
              <span className="text-emerald-400">new</span>
            </Link>
          )) : <div className="text-[11px] text-slate-500">No new entities today</div>}
        </div>
        <div>
          <div className="mb-2 text-[10px] uppercase text-slate-500">Knowledge Clusters</div>
          {graph.clusters.map((c) => (
            <div key={c.type} className="flex justify-between py-1 text-[11px]">
              <span className="capitalize text-slate-300">{c.type}</span>
              <span className="font-mono text-slate-500">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function IntegrationStatusPanel({ integrations }: { integrations: NonNullable<MissionControlData["integrationsStatus"]> }) {
  return (
    <Panel className="p-5">
      <PanelHeader title="System Integrations" subtitle="Connected · Missing · Configuration Required" href="/admin/dashboard/settings" action="Configure" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <Link key={i.name} href={i.href} className={`rounded-xl border p-3 transition hover:brightness-110 ${integrationStatusColors[i.status] ?? integrationStatusColors.missing}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium">{i.name}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-80">{i.status.replace("_", " ")}</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed opacity-80">{i.detail}</p>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
