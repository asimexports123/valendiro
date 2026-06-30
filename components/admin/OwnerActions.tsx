"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuditReport {
  generated_at: string;
  passed: boolean;
  summary: {
    total_urls_tested: number;
    "200_ok": number;
    "3xx_redirect": number;
    "404_not_found": number;
    other_errors: number;
    unreachable: number;
    broken_total: number;
    orphan_pages: number;
  };
  by_type: Record<string, { total: number; ok: number; broken: number }>;
  broken_routes: Array<{ type: string; url: string; db_status?: string; http_status?: number; reason?: string }>;
  orphan_pages: Array<{ type: string; url: string; reason?: string }>;
}

interface Props {
  automationEnabled: boolean;
}

export function OwnerActions({ automationEnabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [showAudit, setShowAudit] = useState(false);

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
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
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

        {/* Relink Topics */}
        <button
          onClick={async () => {
            setLoading("relink_topics");
            setFeedback(null);
            try {
              const res = await fetch("/api/admin/articles/relink-topics", { method: "POST" });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "Relink failed");
              setFeedback({ ok: true, message: json.message ?? "Done" });
              setTimeout(() => setFeedback(null), 4000);
            } catch (err) {
              setFeedback({ ok: false, message: err instanceof Error ? err.message : "Relink failed" });
            } finally {
              setLoading(null);
            }
          }}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-4 font-semibold text-foreground hover:border-primary/30 hover:shadow-md disabled:opacity-50 transition-all duration-200"
        >
          <span className="text-xl">{loading === "relink_topics" ? "⏳" : "🔗"}</span>
          <div className="text-left">
            <p className="font-semibold">{loading === "relink_topics" ? "Linking…" : "Relink Topics"}</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Fix articles missing topic</p>
          </div>
        </button>

        {/* Site Audit */}
        <button
          onClick={async () => {
            setLoading("site_audit");
            setFeedback(null);
            setAuditReport(null);
            setShowAudit(false);
            try {
              const res = await fetch("/api/admin/site-audit");
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "Audit failed");
              setAuditReport(json);
              setShowAudit(true);
              setFeedback({
                ok: json.passed,
                message: json.passed
                  ? `✅ All ${json.summary.total_urls_tested} routes OK`
                  : `⚠️ ${json.summary.broken_total} broken route(s) — see report below`,
              });
            } catch (err) {
              setFeedback({ ok: false, message: err instanceof Error ? err.message : "Audit failed" });
            } finally {
              setLoading(null);
            }
          }}
          disabled={busy}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card px-5 py-4 font-semibold text-foreground hover:border-primary/30 hover:shadow-md disabled:opacity-50 transition-all duration-200"
        >
          <span className="text-xl">{loading === "site_audit" ? "⏳" : "🔍"}</span>
          <div className="text-left">
            <p className="font-semibold">{loading === "site_audit" ? "Auditing…" : "Site Audit"}</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Full route integrity check</p>
          </div>
        </button>
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.ok ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"}`}>
          {feedback.message}
        </div>
      )}

      {/* ── Audit Report Panel ───────────────────────────────────────────── */}
      {auditReport && showAudit && (
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Site Audit Report</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{new Date(auditReport.generated_at).toLocaleString()}</span>
              <button onClick={() => setShowAudit(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tested", value: auditReport.summary.total_urls_tested, color: "" },
              { label: "200 OK", value: auditReport.summary["200_ok"], color: "text-emerald-600 dark:text-emerald-400" },
              { label: "404s", value: auditReport.summary["404_not_found"], color: auditReport.summary["404_not_found"] > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400" },
              { label: "Orphans", value: auditReport.summary.orphan_pages, color: auditReport.summary.orphan_pages > 0 ? "text-amber-600 dark:text-amber-400" : "" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border/40 bg-card p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* By type */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By Type</p>
            {Object.entries(auditReport.by_type).map(([type, g]) => {
              if (!g || g.total === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-foreground w-28">{type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{g.ok}/{g.total}</span>
                    {g.broken > 0 && <span className="text-rose-500 font-medium">{g.broken} broken</span>}
                    {g.broken === 0 && <span className="text-emerald-500">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Broken routes */}
          {auditReport.broken_routes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide">Broken Routes ({auditReport.broken_routes.length})</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {auditReport.broken_routes.map((r, i) => (
                  <div key={i} className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-1.5 py-0.5 rounded">{r.type}</span>
                      {r.http_status && <span className="text-[10px] font-mono text-rose-600">HTTP {r.http_status}</span>}
                      {r.db_status && r.db_status !== "ok" && <span className="text-[10px] font-mono text-amber-600">{r.db_status}</span>}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground truncate">{r.url}</p>
                    {r.reason && <p className="mt-0.5 text-[11px] text-rose-600 dark:text-rose-400">{r.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orphan pages */}
          {auditReport.orphan_pages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Orphan Pages ({auditReport.orphan_pages.length})</p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {auditReport.orphan_pages.map((r, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase text-amber-500">{r.type}</span>
                    <p className="font-mono text-[11px] text-muted-foreground truncate">{r.url}</p>
                    {r.reason && <p className="text-[11px] text-amber-600 dark:text-amber-400">{r.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
