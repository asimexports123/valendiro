"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface CrudFormProps {
  children: React.ReactNode;
  action: (formData: FormData) => Promise<{ error: string | null }>;
  deleteAction?: () => Promise<{ error: string | null }>;
  backPath: string;
  submitLabel?: string;
}

export function CrudForm({
  children,
  action,
  deleteAction,
  backPath,
  submitLabel = "Save",
}: CrudFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await action(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(backPath);
  }

  async function handleDelete() {
    if (!deleteAction) return;
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    const result = await deleteAction();
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(backPath);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {children}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex items-center gap-3 pt-4 border-t border-border/60">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push(backPath)}>
          Cancel
        </Button>
        {deleteAction && (
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
