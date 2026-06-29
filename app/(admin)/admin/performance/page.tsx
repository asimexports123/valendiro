import { MetricCard } from "@/components/admin/MetricCard";
import { getContentPerformance, getLowPerformingContent } from "@/services/admin/dashboardData";

export default async function PerformancePage() {
  const [top, low] = await Promise.all([
    getContentPerformance(10),
    getLowPerformingContent(10),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Content Performance</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Top Performing Content" value={top.data.length} />
        <MetricCard title="Low Performing Content" value={low.data.length} trend="down" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">Top Performing</h2>
        <ul className="divide-y divide-border/60">
          {top.data.map((item) => (
            <li key={item.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-foreground/80">{item.object_type} — {item.object_id}</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {item.overall_health_score}/100
              </span>
            </li>
          ))}
          {top.data.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No data yet</li>}
        </ul>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">Needs Improvement</h2>
        <ul className="divide-y divide-border/60">
          {low.data.map((item) => (
            <li key={item.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-foreground/80">{item.object_type} — {item.object_id}</span>
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                {item.overall_health_score}/100
              </span>
            </li>
          ))}
          {low.data.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No low health content found</li>}
        </ul>
      </div>
    </div>
  );
}
