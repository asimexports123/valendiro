import { MetricCard } from "@/components/admin/MetricCard";
import {
  getDemandIntelligenceMetrics,
  getDemandSignals,
  getDemandTopicQueue,
  getDemandClusters,
} from "@/services/admin/dashboardData";

export default async function DemandIntelligencePage() {
  const [{ metrics, error }, signals, queue, clusters] = await Promise.all([
    getDemandIntelligenceMetrics(),
    getDemandSignals(30),
    getDemandTopicQueue(30),
    getDemandClusters(20),
  ]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700",
      approved: "bg-emerald-50 text-emerald-700",
      rejected: "bg-rose-50 text-rose-700",
      duplicate: "bg-accent text-muted-foreground",
      cannibalized: "bg-orange-50 text-orange-700",
    };
    return map[status] || "bg-accent text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Demand Intelligence</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Discovered (7d)" value={metrics.discoveredKeywords} />
        <MetricCard title="Queued Topics" value={metrics.queuedTopics} />
        <MetricCard title="Rejected" value={metrics.rejectedTopics} trend="down" />
        <MetricCard title="Categories Auto-Created" value={metrics.categoriesCreated} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Duplicate Topics" value={metrics.duplicateTopics} trend="down" />
        <MetricCard title="Cannibalized Topics" value={metrics.cannibalizedTopics} trend="down" />
        <MetricCard title="Pending Clusters" value={metrics.pendingClusters} />
        <MetricCard title="Next Discovery" value="Daily 03:00 UTC" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Discovered Keywords ({signals.data.length})
          </h2>
          <ul className="divide-y divide-border/60 max-h-96 overflow-y-auto">
            {signals.data.map((signal) => (
              <li key={signal.id} className="px-5 py-3 text-sm">
                <p className="text-foreground/80 font-medium">{signal.keyword}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {signal.source} · {signal.search_intent || "unknown"} · {signal.category || "General"}
                </p>
              </li>
            ))}
            {signals.data.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No discovered keywords yet</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Topic Queue ({queue.data.length})
          </h2>
          <ul className="divide-y divide-border/60 max-h-96 overflow-y-auto">
            {queue.data.map((item) => (
              <li key={item.id} className="px-5 py-3 text-sm">
                <p className="text-foreground/80 font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(item.status)}`}>
                    {item.status}
                  </span>
                  score {item.opportunity_score}
                  {item.rejection_reason ? ` · ${item.rejection_reason}` : ""}
                </p>
              </li>
            ))}
            {queue.data.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No queued topics yet</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
          Topic Clusters ({clusters.data.length})
        </h2>
        <ul className="divide-y divide-border/60 max-h-96 overflow-y-auto">
          {clusters.data.map((cluster) => (
            <li key={cluster.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-foreground/80">{cluster.cluster_name} ({cluster.category || "General"})</span>
              <span className="font-medium text-muted-foreground">
                demand {cluster.demand_score} · opp {cluster.opportunity_score}
              </span>
            </li>
          ))}
          {clusters.data.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No clusters yet</li>}
        </ul>
      </div>
    </div>
  );
}
