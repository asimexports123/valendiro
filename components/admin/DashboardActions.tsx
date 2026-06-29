"use client";

import { useState } from "react";

type ActionKey = "demand_run" | "generate_articles" | "quality_audit" | "rebuild_links" | "publish_queue";

const actions: { key: ActionKey; label: string; description: string }[] = [
  { key: "demand_run", label: "Run Demand Discovery", description: "Discover demand and publish topics + articles" },
  { key: "generate_articles", label: "Generate Articles", description: "Publish up to 10 pending articles" },
  { key: "quality_audit", label: "Run Quality Audit", description: "Scan for duplicate content" },
  { key: "rebuild_links", label: "Rebuild Internal Links", description: "Rebuild links for all topics and articles" },
  { key: "publish_queue", label: "Publish Queue", description: "Publish pending topics and articles" },
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
      <h2 className="font-semibold text-foreground mb-4">Operational Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
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
