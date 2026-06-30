"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  automationEnabled: boolean;
}

export function OwnerActions({ automationEnabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  async function run(action: string) {
    setLoading(action);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setFeedback({ ok: true, message: "Done! Refreshing…" });
      setTimeout(() => { router.refresh(); setFeedback(null); }, 1500);
    } catch (err) {
      setFeedback({ ok: false, message: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Start */}
        <button
          onClick={() => run("demand_run")}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-4 font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50 transition-colors"
        >
          <span className="text-xl">{loading === "demand_run" ? "⏳" : "▶️"}</span>
          <div className="text-left">
            <p className="font-semibold">{loading === "demand_run" ? "Running…" : "Start"}</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">Run full publishing cycle</p>
          </div>
        </button>

        {/* Pause / Resume */}
        <button
          onClick={() => run(automationEnabled ? "pause_automation" : "resume_automation")}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4 font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50 transition-colors"
        >
          <span className="text-xl">{loading === "pause_automation" || loading === "resume_automation" ? "⏳" : automationEnabled ? "⏸️" : "▶️"}</span>
          <div className="text-left">
            <p className="font-semibold">{automationEnabled ? "Pause" : "Resume"}</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">{automationEnabled ? "Pause automation" : "Resume automation"}</p>
          </div>
        </button>

        {/* Publish now */}
        <button
          onClick={() => run("publish_queue")}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-4 font-semibold text-foreground hover:border-primary/30 hover:shadow-md disabled:opacity-50 transition-all duration-200"
        >
          <span className="text-xl">{loading === "publish_queue" ? "⏳" : "🚀"}</span>
          <div className="text-left">
            <p className="font-semibold">{loading === "publish_queue" ? "Publishing…" : "Publish Now"}</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Publish pending articles</p>
          </div>
        </button>

        {/* Purge cache */}
        <button
          onClick={async () => {
            setLoading("purge_cache");
            setFeedback(null);
            try {
              const res = await fetch("/api/admin/purge-cache", { method: "POST" });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "Purge failed");
              setFeedback({ ok: true, message: `Cache cleared — ${json.revalidated} pages refreshed.` });
              setTimeout(() => setFeedback(null), 3000);
            } catch (err) {
              setFeedback({ ok: false, message: err instanceof Error ? err.message : "Purge failed" });
            } finally {
              setLoading(null);
            }
          }}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-4 font-semibold text-foreground hover:border-primary/30 hover:shadow-md disabled:opacity-50 transition-all duration-200"
        >
          <span className="text-xl">{loading === "purge_cache" ? "⏳" : "🔄"}</span>
          <div className="text-left">
            <p className="font-semibold">{loading === "purge_cache" ? "Clearing…" : "Purge Cache"}</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Refresh all public pages</p>
          </div>
        </button>

        {/* Validate routes */}
        <button
          onClick={async () => {
            setLoading("validate_routes");
            setFeedback(null);
            try {
              const res = await fetch("/api/admin/validate-routes");
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "Validation failed");
              const { total, ok, broken, byType } = json;
              const msg = broken === 0
                ? `✅ All ${total} routes OK — cats:${byType.categories.ok}/${byType.categories.total} cols:${byType.collections.ok}/${byType.collections.total} topics:${byType.topics.ok}/${byType.topics.total} articles:${byType.articles.ok}/${byType.articles.total}`
                : `⚠️ ${broken} broken of ${total} — check /api/admin/validate-routes for details`;
              setFeedback({ ok: broken === 0, message: msg });
            } catch (err) {
              setFeedback({ ok: false, message: err instanceof Error ? err.message : "Validation failed" });
            } finally {
              setLoading(null);
            }
          }}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-4 font-semibold text-foreground hover:border-primary/30 hover:shadow-md disabled:opacity-50 transition-all duration-200"
        >
          <span className="text-xl">{loading === "validate_routes" ? "⏳" : "🔍"}</span>
          <div className="text-left">
            <p className="font-semibold">{loading === "validate_routes" ? "Checking…" : "Validate Routes"}</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Check for broken public pages</p>
          </div>
        </button>
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.ok ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
