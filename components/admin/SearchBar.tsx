"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = new FormData(form).get("q") as string;
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        name="q"
        type="text"
        defaultValue={searchParams.get("q") || ""}
        placeholder="Search..."
        className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      <button
        type="submit"
        className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition"
      >
        Search
      </button>
    </form>
  );
}
