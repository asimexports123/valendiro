import { createAdminClient } from "@/lib/supabase/admin";

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function PublicationLogsPage() {
  const supabase = createAdminClient();

  const { data: publicationLogs } = await supabase
    .from("publication_logs")
    .select("id, topic_id, action, result, created_at, error_message, duration_ms")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Publication Logs</h1>
        <p className="mt-1 text-muted-foreground text-sm">Track publication pipeline activity</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Publications</h2>
            <span className="text-sm text-muted-foreground">{publicationLogs?.length || 0} entries</span>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {publicationLogs && publicationLogs.length > 0 ? (
            publicationLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={log.result === "success" ? "text-emerald-600" : "text-rose-600"}>
                    {log.result === "success" ? "✅" : "❌"}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{log.action}</p>
                    {log.topic_id && (
                      <p className="text-sm text-muted-foreground">Topic: {log.topic_id}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {log.error_message && (
                    <span className="text-xs text-rose-600 max-w-xs truncate">{log.error_message}</span>
                  )}
                  {log.duration_ms && (
                    <span className="text-xs text-muted-foreground">{log.duration_ms}ms</span>
                  )}
                  <span className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No publication logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
