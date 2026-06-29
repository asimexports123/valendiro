import { getSystemLogs } from "@/services/admin/dashboardData";

export default async function SystemLogsPage() {
  const { data, error } = await getSystemLogs(100);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">System Logs</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-foreground/80">{log.action}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : log.status === "failed"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-accent text-muted-foreground"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground max-w-xs truncate">{log.message || "—"}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-sm text-muted-foreground">No logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
