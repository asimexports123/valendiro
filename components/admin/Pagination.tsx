import Link from "next/link";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function Pagination({ page, pageSize, total, basePath, searchParams = {} }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function buildLink(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex items-center gap-2">
        {hasPrev && (
          <Link href={buildLink(page - 1)} className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors">
            Previous
          </Link>
        )}
        {hasNext && (
          <Link href={buildLink(page + 1)} className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
