export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground text-sm">Production metrics and performance data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Published Pages", value: "—" },
          { label: "Indexed Pages", value: "—" },
          { label: "Organic Clicks", value: "—" },
          { label: "CTR", value: "—" },
          { label: "Average Position", value: "—" },
          { label: "Affiliate Clicks", value: "—" },
          { label: "Revenue", value: "—" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
        <p className="text-muted-foreground">Analytics data will be available when production metrics are integrated</p>
      </div>
    </div>
  );
}
