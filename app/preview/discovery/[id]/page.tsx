import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function PreviewDiscoveryRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Get run
  const { data: run } = await supabase
    .from("discovery_runs")
    .select(`
      id, status, slots_analyzed, candidates_found,
      candidates_accepted, candidates_rejected, candidates_duplicate,
      started_at, completed_at, error_message, metadata,
      discovery_sources(slug, name, adapter_type),
      topics(slug, topic_translations(title))
    `)
    .eq("id", id)
    .single();

  if (!run) notFound();

  const topicTitle = (run as any).topics?.topic_translations?.[0]?.title ?? (run as any).topics?.slug ?? "—";
  const sourceName = (run as any).discovery_sources?.name ?? "—";
  const adapterType = (run as any).discovery_sources?.adapter_type ?? "—";
  const durationMs = (run.metadata as any)?.duration_ms ?? null;

  // Get candidates with metadata (attribution + score_explanation)
  const { data: candidates } = await supabase
    .from("discovery_candidates")
    .select(`
      id, title, description, source_url, metadata,
      relevance_score, confidence_score, status, rejection_reason,
      hub_slots(slug, hub_slot_translations(title))
    `)
    .eq("run_id", id)
    .order("relevance_score", { ascending: false });

  const candidateItems = (candidates ?? []).map((c: any) => {
    const meta = c.metadata ?? {};
    const attribution = meta.attribution ?? null;
    const explanation = meta.score_explanation ?? null;
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      sourceUrl: c.source_url,
      relevance: c.relevance_score,
      confidence: c.confidence_score,
      combined: explanation?.combinedScore ?? Math.round(c.relevance_score * 0.6 + c.confidence_score * 0.4),
      status: c.status,
      rejectionReason: c.rejection_reason,
      slotTitle: c.hub_slots?.hub_slot_translations?.[0]?.title ?? c.hub_slots?.slug ?? "—",
      attribution,
      explanation,
    };
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "accepted": return "✅";
      case "rejected": return "❌";
      case "duplicate": return "🔁";
      default: return "⏳";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-muted-foreground bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded inline-block mb-2">
          PREVIEW MODE — Read Only
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/preview/discovery" className="hover:text-foreground transition-colors">Discovery</Link>
          <span>/</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Discovery Run: {topicTitle}
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">{sourceName}</span>
          <span className="text-xs text-muted-foreground">{adapterType}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            run.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : run.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          }`}>
            {run.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-foreground">{run.slots_analyzed}</div>
          <div className="text-xs text-muted-foreground">Slots</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-foreground">{run.candidates_found}</div>
          <div className="text-xs text-muted-foreground">Found</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-green-600">{run.candidates_accepted}</div>
          <div className="text-xs text-muted-foreground">Accepted</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-red-500">{run.candidates_rejected}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-amber-500">{run.candidates_duplicate}</div>
          <div className="text-xs text-muted-foreground">Duplicates</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-2xl font-bold text-foreground">{durationMs ? `${durationMs}ms` : "—"}</div>
          <div className="text-xs text-muted-foreground">Duration</div>
        </Card>
      </div>

      {run.error_message && (
        <Card className="border-red-200 dark:border-red-900/50">
          <p className="text-sm text-red-600 dark:text-red-400">Error: {run.error_message}</p>
        </Card>
      )}

      {/* Candidates */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Candidates ({candidateItems.length})
        </h2>
        <div className="space-y-3">
          {candidateItems.map((c) => (
            <Card key={c.id} className="py-3">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{statusIcon(c.status)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground truncate">{c.title}</h3>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded">
                        Score: {c.combined}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>

                  {/* Score Explanation */}
                  {c.explanation && (
                    <div className="mt-2 p-2 bg-muted/30 rounded-lg">
                      <div className="text-xs font-medium text-foreground mb-1">Score Breakdown:</div>
                      <div className="space-y-0.5">
                        {(c.explanation.components as { factor: string; points: number; reason: string }[]).map((comp: { factor: string; points: number; reason: string }, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{comp.reason}</span>
                            <span className={`font-mono ${comp.points > 0 ? "text-green-600" : "text-red-500"}`}>
                              {comp.points > 0 ? "+" : ""}{comp.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attribution */}
                  {c.attribution && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {c.attribution.sourceName}
                      </span>
                      <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                        {c.attribution.adapterName}
                      </span>
                      <span className="bg-muted/50 px-1.5 py-0.5 rounded">
                        {c.attribution.extractionMethod}
                      </span>
                      {c.sourceUrl && (
                        <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
                          source
                        </a>
                      )}
                    </div>
                  )}

                  {/* Slot + Status */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Slot: <span className="font-medium">{c.slotTitle}</span>
                    </span>
                    {c.rejectionReason && (
                      <span className="text-xs text-red-500">{c.rejectionReason}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
        <Link href="/preview/discovery" className="hover:text-foreground transition-colors">← All Runs</Link>
        {" · "}
        <Link href="/preview/hubs" className="hover:text-foreground transition-colors">Hubs</Link>
        {" · "}
        <Link href="/preview/entity-types" className="hover:text-foreground transition-colors">Entity Types</Link>
      </div>
    </div>
  );
}
