"use client";

import { useState } from "react";

type ActionKey = "quality_audit" | "rebuild_links";

const actions: { key: ActionKey; label: string; description: string }[] = [
  { key: "quality_audit", label: "Run Quality Audit", description: "Scan for duplicate content" },
  { key: "rebuild_links", label: "Rebuild Internal Links", description: "Rebuild links for all topics and articles" },
];

const retiredActions = [
  { label: "Run Demand Discovery", reason: "Retired Phase 0" },
  { label: "Generate Articles", reason: "Retired Phase 0" },
  { label: "Publish Queue", reason: "Retired Phase 0" },
];

export function DashboardActions() {
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [lastResult, setLastResult] = useState<{ action: string; result: string } | null>(null);

  async function runAction(action: ActionKey) {
    setLoading(action);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setLastResult({ action, result: JSON.stringify(json.result, null, 2) });
    } catch (err) {
      setLastResult({ action, result: err instanceof Error ? err.message : "Action failed" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-[var(--shadow)]">
      <h2 className="font-semibold text-foreground mb-2">Operational Actions</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Demand pipeline actions retired. Canonical ingestion: discovery cron only.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map(({ key, label, description }) => (
          <button
            key={key}
            onClick={() => runAction(key)}
            disabled={loading !== null}
            className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors disabled:opacity-60"
          >
            <p className="font-medium text-foreground">{loading === key ? "Running..." : label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </button>
        ))}
        {retiredActions.map(({ label, reason }) => (
          <div
            key={label}
            className="text-left rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 opacity-60"
          >
            <p className="font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
          </div>
        ))}
      </div>
      {lastResult && (
        <div className="mt-4 rounded-xl bg-muted p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">
          <span className="font-semibold text-foreground">{lastResult.action}:</span>{" "}
          {lastResult.result}
        </div>
      )}
    </div>
  );
}
