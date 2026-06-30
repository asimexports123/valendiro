import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface Column {
  key: string;
  label: string;
}

interface AdminTableProps {
  rows: Record<string, unknown>[];
  columns: Column[];
  idKey?: string;
  basePath: string;
  deleteTable?: string;
}

export function AdminTable({
  rows,
  columns,
  idKey = "id",
  basePath,
  deleteTable,
}: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)]">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-foreground font-medium">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">{col.label}</th>
            ))}
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                No items found.
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const id = String(row[idKey] ?? "");
            return (
              <tr key={id} className="hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 max-w-xs truncate">
                    {String(row[col.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`${basePath}/${id}`}
                      className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      Edit
                    </Link>
                    {deleteTable && (
                      <DeleteButton id={id} table={deleteTable} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
