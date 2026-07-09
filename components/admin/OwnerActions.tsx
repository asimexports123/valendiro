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
  const btnBase = "flex items-center gap-3 rounded-2xl border px-5 py-4 font-semibold text-left disabled:opacity-50 transition-all duration-200";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
        Demand pipeline retired (Phase 0). Canonical pipeline runs via discovery cron only.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          disabled
          title="Retired — use discovery pipeline"
          className={`${btnBase} border-border/40 bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60`}
        >
          <span className="text-2xl">⏸️</span>
          <div>
            <p className="font-semibold">Start Pipeline (retired)</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">Demand path disabled — architecture frozen</p>
          </div>
        </button>

        <button
          onClick={() => run(automationEnabled ? "pause_automation" : "resume_automation")}
          disabled={busy}
          className={`${btnBase} border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40`}
        >
          <span className="text-2xl">{loading === "pause_automation" || loading === "resume_automation" ? "⏳" : automationEnabled ? "⏸️" : "▶️"}</span>
          <div>
            <p className="font-semibold">{automationEnabled ? "Pause Automation" : "Resume Automation"}</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">Discovery cron kill switch only</p>
          </div>
        </button>

        <button
          disabled
          title="Retired — demand publish queue"
          className={`${btnBase} border-border/40 bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60`}
        >
          <span className="text-2xl">🔄</span>
          <div>
            <p className="font-semibold">Regenerate Failed (retired)</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">Use knowledge asset pipeline in Phase 1+</p>
          </div>
        </button>

        <a
          href="/admin/articles"
          className={`${btnBase} border-border/60 bg-card text-foreground hover:border-primary/30 hover:shadow-md`}
        >
          <span className="text-2xl">📄</span>
          <div>
            <p className="font-semibold">View Articles</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Browse legacy article records</p>
          </div>
        </a>
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          feedback.ok
            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
            : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
        }`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
