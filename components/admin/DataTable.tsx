"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface DataTableProps<T> {
  rows: T[];
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  getRowId: (row: T) => string;
  basePath: string;
  onDelete?: (id: string) => Promise<void>;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  basePath,
  onDelete,
}: DataTableProps<T>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    if (onDelete) {
      await onDelete(id);
      startTransition(() => router.refresh());
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
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(id)}
                        disabled={isPending}
                        className="text-rose-600 hover:text-rose-700 disabled:opacity-50 font-medium transition-colors"
                      >
                        Delete
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
