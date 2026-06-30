const REASONS = [
  { emoji: "✅", title: "Accurate", description: "Fact-checked, sourced content." },
  { emoji: "🔄", title: "Always Fresh", description: "Updated as the world changes." },
  { emoji: "🧠", title: "Deep Learning", description: "Structured guides, not surface answers." },
  { emoji: "📱", title: "Read Anywhere", description: "Beautiful on every device." },
];

export function WhyValendiro() {
  return (
    <section className="py-10 sm:py-12 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {REASONS.map((r) => (
            <div key={r.title} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/60">
              <span className="text-xl shrink-0">{r.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
