"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArticleApproveButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function approve() {
    if (!confirm("Approve this draft and publish it?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setDone(true);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error approving article");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-4 py-2 text-sm font-semibold">
        ✓ Published
      </span>
    );
  }

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold transition-colors"
    >
      {loading ? "Publishing…" : "Approve & Publish"}
    </button>
  );
}
