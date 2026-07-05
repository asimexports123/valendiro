export default function SourcesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Source Health</h1>
        <p className="mt-1 text-muted-foreground text-sm">Monitor registered source health and status</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="p-6 border-b border-border/40">
          <h2 className="text-lg font-semibold text-foreground">Registered Sources</h2>
        </div>

        <div className="p-12 text-center">
          <p className="text-muted-foreground">Source monitoring will be implemented when production sources are registered</p>
        </div>
      </div>
    </div>
  );
}
