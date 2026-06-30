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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* ── Start Pipeline */}
        <button
          onClick={() => run("demand_run")}
          disabled={busy}
          className={`${btnBase} border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40`}
        >
          <span className="text-2xl">{loading === "demand_run" ? "⏳" : "▶️"}</span>
          <div>
            <p className="font-semibold">{loading === "demand_run" ? "Running…" : "Start Pipeline"}</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">Generate and publish new articles</p>
          </div>
        </button>

        {/* ── Pause / Resume */}
        <button
          onClick={() => run(automationEnabled ? "pause_automation" : "resume_automation")}
          disabled={busy}
          className={`${btnBase} border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40`}
        >
          <span className="text-2xl">{loading === "pause_automation" || loading === "resume_automation" ? "⏳" : automationEnabled ? "⏸️" : "▶️"}</span>
          <div>
            <p className="font-semibold">{automationEnabled ? "Pause Pipeline" : "Resume Pipeline"}</p>
            <p className="text-xs font-normal mt-0.5 opacity-70">{automationEnabled ? "Stop automatic generation" : "Resume automatic generation"}</p>
          </div>
        </button>

        {/* ── Regenerate Failed */}
        <button
          onClick={() => run("publish_queue")}
          disabled={busy}
          className={`${btnBase} border-border/60 bg-card text-foreground hover:border-primary/30 hover:shadow-md`}
        >
          <span className="text-2xl">{loading === "publish_queue" ? "⏳" : "�"}</span>
          <div>
            <p className="font-semibold">{loading === "publish_queue" ? "Running…" : "Regenerate Failed"}</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Retry failed articles</p>
          </div>
        </button>

        {/* ── View Articles */}
        <a
          href="/admin/articles"
          className={`${btnBase} border-border/60 bg-card text-foreground hover:border-primary/30 hover:shadow-md`}
        >
          <span className="text-2xl">�</span>
          <div>
            <p className="font-semibold">View Articles</p>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">Browse published and draft articles</p>
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
