function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow)]">
      <div className="h-5 w-3/4 rounded-md skeleton" />
      <div className="mt-3 h-4 w-full rounded-md skeleton" />
      <div className="mt-2 h-4 w-2/3 rounded-md skeleton" />
    </div>
  );
}

export default function PublicLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="h-10 w-1/2 rounded-lg skeleton mb-4" />
      <div className="h-5 w-1/3 rounded-md skeleton mb-12" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
