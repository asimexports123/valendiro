import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function PreviewDiscoveryPage() {
  const supabase = createAdminClient();

  // Get all discovery runs with source + topic info
  const { data: runs } = await supabase
    .from("discovery_runs")
    .select(`
      id, status, slots_analyzed, candidates_found,
      candidates_accepted, candidates_rejected, candidates_duplicate,
      started_at, completed_at, error_message,
      discovery_sources(slug, name, adapter_type),
      topics(slug, topic_translations(title))
    `)
    .order("started_at", { ascending: false });

  const runItems = (runs ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    slotsAnalyzed: r.slots_analyzed,
    candidatesFound: r.candidates_found,
    candidatesAccepted: r.candidates_accepted,
    candidatesRejected: r.candidates_rejected,
    candidatesDuplicate: r.candidates_duplicate,
    startedAt: new Date(r.started_at).toLocaleString(),
    completedAt: r.completed_at ? new Date(r.completed_at).toLocaleString() : "—",
    sourceName: r.discovery_sources?.name ?? "—",
    adapterType: r.discovery_sources?.adapter_type ?? "—",
    topicTitle: r.topics?.topic_translations?.[0]?.title ?? r.topics?.slug ?? "—",
    topicSlug: r.topics?.slug ?? "",
    error: r.error_message,
  }));

  // Get sources
  const { data: sources } = await supabase
    .from("discovery_sources")
    .select("id, slug, name, adapter_type, status")
    .order("created_at");

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div>
        <div className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded inline-block mb-2">
          PREVIEW MODE — Read Only
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Discovery Engine</h1>
        <p className="text-muted-foreground mt-1">Coverage-driven knowledge discovery framework</p>
      </div>

      {/* Sources */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-3">Registered Sources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(sources ?? []).map((s: any) => (
            <Card key={s.id} className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{s.name}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{s.adapter_type}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  s.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
                }`}>
                  {s.status}
                </span>
              </div>
            </Card>
          ))}
          {(sources ?? []).length === 0 && (
            <Card><p className="text-center text-muted-foreground py-4">No sources registered.</p></Card>
          )}
        </div>
      </div>

      {/* Runs */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-3">Discovery Runs</h2>
        {runItems.length === 0 ? (
          <Card><p className="text-center text-muted-foreground py-8">No discovery runs yet.</p></Card>
        ) : (
          <div className="space-y-3">
            {runItems.map((run) => (
              <Link key={run.id} href={`/preview/discovery/${run.id}`}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-base font-medium text-foreground">{run.topicTitle}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">{run.sourceName}</span>
                        <span className="text-xs text-muted-foreground">{run.adapterType}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      run.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : run.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-foreground">{run.slotsAnalyzed}</div>
                      <div className="text-xs text-muted-foreground">Slots</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-foreground">{run.candidatesFound}</div>
                      <div className="text-xs text-muted-foreground">Found</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">{run.candidatesAccepted}</div>
                      <div className="text-xs text-muted-foreground">Accepted</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-500">{run.candidatesRejected + run.candidatesDuplicate}</div>
                      <div className="text-xs text-muted-foreground">Rejected</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{run.startedAt}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
        <Link href="/preview/hubs" className="hover:text-foreground transition-colors">← Knowledge Hubs</Link>
        {" · "}
        <Link href="/preview/entity-types" className="hover:text-foreground transition-colors">Entity Types</Link>
      </div>
    </div>
  );
}
