import { MetricCard } from "@/components/admin/MetricCard";
import {
  getDemandIntelligenceMetrics,
  getKeywordDecisionReport,
  type KeywordDecisionRow,
} from "@/services/admin/dashboardData";

function ScoreBar({ value, max = 100, color = "bg-blue-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums w-7 text-right text-muted-foreground">{value}</span>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    publish: "bg-emerald-50 text-emerald-700 border-emerald-200",
    backlog: "bg-amber-50 text-amber-700 border-amber-200",
    reject: "bg-rose-50 text-rose-700 border-rose-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    duplicate: "bg-slate-50 text-slate-600 border-slate-200",
    cannibalized: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${map[decision] || "bg-accent text-muted-foreground"}`}>
      {decision}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const map: Record<string, string> = {
    how_to: "bg-violet-50 text-violet-700",
    educational: "bg-blue-50 text-blue-700",
    informational: "bg-sky-50 text-sky-700",
    comparison: "bg-indigo-50 text-indigo-700",
    buying_guide: "bg-orange-50 text-orange-700",
    commercial: "bg-amber-50 text-amber-700",
    news: "bg-red-50 text-red-700",
    entertainment: "bg-pink-50 text-pink-700",
    local: "bg-slate-50 text-slate-600",
    blocked: "bg-rose-50 text-rose-700",
  };
  const label = intent.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[intent] || "bg-accent text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function ScoreColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

export default async function DemandIntelligencePage() {
  const [{ metrics, error }, { data: rows }] = await Promise.all([
    getDemandIntelligenceMetrics(),
    getKeywordDecisionReport(100),
  ]);

  const publishCount = rows.filter((r) => r.status === "approved" || r.research?.decision === "publish").length;
  const backlogCount = rows.filter((r) => r.research?.decision === "backlog").length;
  const rejectCount = rows.filter((r) => r.status === "rejected" || r.research?.decision === "reject").length;
  const pendingResearch = rows.filter((r) => !r.research).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Keyword Decision Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every discovered keyword is evaluated across 9 dimensions before any content is created.
        </p>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard title="Discovered (7d)" value={metrics.discoveredKeywords} />
        <MetricCard title="Approved" value={publishCount} />
        <MetricCard title="Backlog" value={backlogCount} />
        <MetricCard title="Rejected" value={rejectCount} trend="down" />
        <MetricCard title="Awaiting Research" value={pendingResearch} />
        <MetricCard title="Pending Clusters" value={metrics.pendingClusters} />
      </div>

      {/* Decision Report Table */}
      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Keyword Research — Decision Log ({rows.length})</h2>
          <span className="text-xs text-muted-foreground">Sorted by most recent · Max 100</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Keyword</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Intent</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entity</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Demand</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Competition</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Ranking Opp.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Evergreen</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Biz Value</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">Gap</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decision</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((row) => {
                const r = row.research;
                const finalScore = r?.finalDecisionScore ?? row.opportunity_score ?? 0;
                const decision = r?.decision ?? row.status;
                const reason = r?.decisionReason ?? row.rejection_reason ?? "—";
                return (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px]">
                      <span className="block truncate" title={row.keyword}>{row.keyword}</span>
                    </td>
                    <td className="px-3 py-3">
                      {r ? <IntentBadge intent={r.searchIntent} /> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 max-w-[140px]">
                      <span className="block truncate text-xs text-muted-foreground" title={r?.detectedEntity ?? "—"}>
                        {r?.detectedEntity ?? <span className="italic">unresolved</span>}
                        {r && (
                          <span className={`ml-1 ${r.entityConfidence === "high" ? "text-emerald-600" : r.entityConfidence === "medium" ? "text-amber-600" : "text-rose-500"}`}>
                            [{r.entityConfidence}]
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 w-28">
                      {r ? <ScoreBar value={r.searchDemandScore} color={ScoreColor(r.searchDemandScore)} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 w-28">
                      {r ? (
                        <div>
                          <ScoreBar value={r.competitionScore} color={r.competitionScore >= 70 ? "bg-rose-400" : r.competitionScore >= 50 ? "bg-amber-400" : "bg-emerald-500"} />
                          <span className="text-[10px] text-muted-foreground">{r.competitionLevel}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 w-28">
                      {r ? <ScoreBar value={r.rankingOpportunityScore} color={ScoreColor(r.rankingOpportunityScore)} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 w-28">
                      {r ? <ScoreBar value={r.evergreenScore} color={ScoreColor(r.evergreenScore)} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 w-28">
                      {r ? <ScoreBar value={r.businessValueScore} color={ScoreColor(r.businessValueScore)} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 w-28">
                      {r ? <ScoreBar value={r.knowledgeGapScore} color={ScoreColor(r.knowledgeGapScore)} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-base font-bold tabular-nums ${finalScore >= 58 ? "text-emerald-600" : finalScore >= 38 ? "text-amber-600" : "text-rose-500"}`}>
                        {finalScore}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <DecisionBadge decision={decision} />
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-xs text-muted-foreground block truncate" title={reason}>{reason}</span>
                      {r && (r.newsPenalty > 0 || r.celebrityPenalty > 0 || r.localPenalty > 0) && (
                        <span className="text-[10px] text-rose-400 mt-0.5 block">
                          Penalties: {[r.newsPenalty > 0 && `news -${r.newsPenalty}`, r.celebrityPenalty > 0 && `celebrity -${r.celebrityPenalty}`, r.localPenalty > 0 && `local -${r.localPenalty}`].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No keyword research data yet. Run the pipeline to populate the Decision Report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Scoring Reference</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <div><span className="font-medium text-foreground">Demand</span> — Estimated monthly search volume proxy</div>
          <div><span className="font-medium text-foreground">Competition</span> — SERP difficulty (lower = better opportunity)</div>
          <div><span className="font-medium text-foreground">Ranking Opp.</span> — Realistic chance Valendiro can rank</div>
          <div><span className="font-medium text-foreground">Evergreen</span> — Long-term relevance vs. temporary trend</div>
          <div><span className="font-medium text-foreground">Biz Value</span> — Affiliate / commercial / educational potential</div>
          <div><span className="font-medium text-foreground">Gap</span> — How underserved this topic is in our content</div>
          <div><span className="font-medium text-foreground">Entity</span> — Confidence the keyword maps to a real entity</div>
          <div><span className="font-medium text-foreground text-emerald-600">≥58</span> — Publish threshold</div>
          <div><span className="font-medium text-foreground text-amber-600">38–57</span> — Backlog (review later)</div>
          <div><span className="font-medium text-foreground text-rose-500">&lt;38</span> — Reject</div>
        </div>
      </div>
    </div>
  );
}
