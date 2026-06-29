import { getQueueItems } from "@/services/admin/dashboardData";

export default async function QueueMonitorPage() {
  const { generation, update, priority, error } = await getQueueItems("pending", 25);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Content Queue Monitor</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Generation ({generation.length})
          </h2>
          <ul className="divide-y divide-border/60">
            {generation.map((item) => (
              <li key={item.id} className="px-5 py-3 text-sm">
                <p className="text-foreground/80 font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">Score: {item.priority_score}</p>
              </li>
            ))}
            {generation.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">Empty</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Update ({update.length})
          </h2>
          <ul className="divide-y divide-border/60">
            {update.map((item) => (
              <li key={item.id} className="px-5 py-3 text-sm">
                <p className="text-foreground/80 font-medium">{item.reason}</p>
                <p className="text-xs text-muted-foreground">Score: {item.priority_score}</p>
              </li>
            ))}
            {update.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">Empty</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
          <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">
            Priority ({priority.length})
          </h2>
          <ul className="divide-y divide-border/60">
            {priority.map((item) => (
              <li key={item.id} className="px-5 py-3 text-sm">
                <p className="text-foreground/80 font-medium">{item.decision_type}</p>
                <p className="text-xs text-muted-foreground">Score: {item.priority_score}</p>
              </li>
            ))}
            {priority.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">Empty</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
