"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ id, table }: { id: string; table: string }) {
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id, secret: "local-test" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Delete failed");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || deleting}
      className="text-rose-600 hover:text-rose-700 disabled:opacity-40 font-medium transition-colors"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
