"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Brain,
  DollarSign,
  Globe,
  Radio,
  Server,
  TrendingUp,
} from "lucide-react";
import { fmt, Panel, PanelHeader, SectionEyebrow } from "./dashboard-ui";

export type MissionControlData = {
  ceoSummary: {
    improvedToday: string[];
    failedToday: string[];
    blocked: string[];
    earning: string;
    needsAttention: string[];
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
    href: string;
  };
  revenue: {
    missingIntegrations: string[];
    totalToday: number;
    totalWeek: number;
    totalMonth: number;
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
  integrationsMissing: string[];
};

function StatCell({ label, value, href }: { label: string; value: string | number; href?: string }) {
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
  return (
    <Panel accent="violet" className="p-5">
      <SectionEyebrow>CEO Briefing — Today</SectionEyebrow>
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

export function KnowledgeGrowthPanel({ data }: { data: MissionControlData }) {
  const k = data.knowledgeGrowth;
  return (
    <Panel accent="sky" className="p-5">
      <PanelHeader title="Knowledge Growth" subtitle="Live graph & package accumulation" href={k.href} action="Inspect" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="Facts Today" value={fmt(k.factsToday)} href={k.href} />
        <StatCell label="Entities Today" value={fmt(k.entitiesToday)} href={k.href} />
        <StatCell label="Relationships Today" value={fmt(k.relationshipsToday)} href={k.href} />
        <StatCell label="Packages Upgraded" value={fmt(k.packagesUpgradedToday)} href={k.href} />
        <StatCell label="Topics Improved" value={fmt(k.topicsImprovedToday)} href="/admin/dashboard/publishing" />
        <StatCell label="Topics Rejected" value={fmt(k.topicsRejectedToday)} href="/admin/dashboard/discovery" />
        <StatCell label="Total Knowledge" value={fmt(k.knowledgeAccumulated)} href={k.href} />
        <StatCell label="Awaiting Enrichment" value={fmt(k.awaitingEnrichment)} href="/admin/dashboard/quality" />
      </div>
    </Panel>
  );
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
      <PanelHeader title="Knowledge Quality Command" subtitle="Package depth tiers — live" href="/admin/dashboard/quality" action="Inspect" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCell label="World Class" value={q.worldClass} href="/admin/dashboard/quality" />
        <StatCell label="Good" value={q.good} href="/admin/dashboard/quality" />
        <StatCell label="Average" value={q.average} href="/admin/dashboard/quality" />
        <StatCell label="Weak" value={q.weak} href="/admin/dashboard/quality" />
        <StatCell label="Broken" value={q.broken} href="/admin/dashboard/quality" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
            <Brain className="h-3 w-3" /> Weakest Topics
          </div>
          {data.thinTopics.map((t) => (
            <Link key={t.slug} href={t.href} className="flex justify-between rounded-lg px-2 py-1.5 text-[11px] hover:bg-white/[0.03]">
              <span className="truncate text-slate-300">{t.title}</span>
              <span className="text-rose-300">{t.factCount} facts</span>
            </Link>
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
            <TrendingUp className="h-3 w-3" /> Strongest Topics
          </div>
          {data.strongTopics.map((t) => (
            <Link key={t.slug} href={t.href} className="flex justify-between rounded-lg px-2 py-1.5 text-[11px] hover:bg-white/[0.03]">
              <span className="truncate text-slate-300">{t.title}</span>
              <span className="text-emerald-300">{t.factCount} facts</span>
            </Link>
          ))}
        </div>
      </div>
    </Panel>
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
