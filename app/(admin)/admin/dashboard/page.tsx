import { MetricCard } from "@/components/admin/MetricCard";
import { SimpleBarChart } from "@/components/admin/SimpleBarChart";
import { getDashboardMetrics, getSystemStatus, getPublishingMetrics } from "@/services/admin/dashboardData";

export default async function DashboardPage() {
  const [{ metrics, error }, { status, error: statusError }, { metrics: publishing, error: publishingError }] = await Promise.all([
    getDashboardMetrics(),
    getSystemStatus(),
    getPublishingMetrics(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Overview</h1>
      {(error || statusError || publishingError) && (
        <p className="text-sm text-rose-600">{[error, statusError, publishingError].filter(Boolean).join("; ")}</p>
      )}

      <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-[var(--shadow)]">
        <h2 className="font-semibold text-foreground mb-3">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Automation</p>
            <p className={`text-lg font-semibold ${status.automationEnabled ? "text-emerald-600" : "text-rose-600"}`}>
              {status.automationEnabled ? "ON" : "OFF"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Publish Limit / Run</p>
            <p className="text-lg font-semibold text-foreground">{status.publishLimitPerRun}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Queue Size</p>
            <p className="text-lg font-semibold text-foreground">{status.queueSize}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Failed Jobs (24h)</p>
            <p className={`text-lg font-semibold ${status.failedJobs > 0 ? "text-rose-600" : "text-emerald-600"}`}>{status.failedJobs}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Demand Discovery: {status.demandDiscoveryEnabled ? "ON" : "OFF"}</span>
          <span>Quality Gate: {status.qualityGateEnabled ? "ON" : "OFF"}</span>
          <span>Last Cron: {status.lastCronRun ? new Date(status.lastCronRun).toLocaleString() : "—"}</span>
          <span>Last Publish: {status.lastSuccessfulPublish ? new Date(status.lastSuccessfulPublish).toLocaleString() : "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Articles" value={metrics.totalArticles} />
        <MetricCard title="Topics" value={metrics.totalTopics} />
        <MetricCard title="Questions" value={metrics.totalQuestions} />
        <MetricCard title="Active Queue" value={metrics.activeQueueItems} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Avg Health Score" value={`${metrics.avgHealthScore}/100`} trend={metrics.avgHealthScore >= 60 ? "up" : "down"} />
        <MetricCard title="Low Health Content" value={metrics.lowHealthCount} trend={metrics.lowHealthCount > 0 ? "down" : "up"} />
        <MetricCard title="Pending SEO Suggestions" value={metrics.pendingSeoSuggestions} />
        <MetricCard title="Est. Revenue (30d)" value={`$${metrics.estimatedRevenue.toFixed(2)}`} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-[var(--shadow)]">
        <h2 className="font-semibold text-foreground mb-3">Publishing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Drafts" value={publishing.drafts} />
          <MetricCard title="Published" value={publishing.published} />
          <MetricCard title="Archived" value={publishing.archived} />
          <MetricCard title="Update Queue" value={publishing.updateQueue} />
        </div>
        <div className="mt-6">
          <SimpleBarChart
            data={Object.entries(publishing.lifecycle).map(([key, value]) => ({
              label: key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              value,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
