"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface DataTableProps<T> {
  rows: T[];
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  getRowId: (row: T) => string;
  basePath: string;
  deleteTable?: string;
  onDelete?: (id: string) => Promise<void>;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  basePath,
  deleteTable,
  onDelete,
}: DataTableProps<T>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      if (deleteTable) {
        const res = await fetch("/api/admin/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: deleteTable, id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Delete failed");
          return;
        }
      } else if (onDelete) {
        await onDelete(id);
      }
      startTransition(() => router.refresh());
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)]">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-foreground font-medium">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => {
            const id = getRowId(row);
            return (
              <tr key={id} className="hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`${basePath}/${id}`}
                      className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      Edit
                    </Link>
                    {(deleteTable || onDelete) && (
                      <button
                        onClick={() => handleDelete(id)}
                        disabled={isPending || deletingId === id}
                        className="text-rose-600 hover:text-rose-700 disabled:opacity-40 font-medium transition-colors"
                      >
                        {deletingId === id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
