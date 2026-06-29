import { ShieldCheck, RefreshCw, Users, LayoutTemplate } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Trusted",
    description: "Every article is fact-checked, sourced, and reviewed for accuracy before it reaches you.",
  },
  {
    icon: RefreshCw,
    title: "Continuously Updated",
    description: "Our editorial team monitors change and keeps content fresh as the world evolves.",
  },
  {
    icon: Users,
    title: "Human Quality",
    description: "Clear, well-structured writing designed for real readers, not algorithms.",
  },
  {
    icon: LayoutTemplate,
    title: "Structured Knowledge",
    description: "Connected concepts, collections, and guides that help you understand any topic deeply.",
  },
];

export function WhyValendiro() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Why Valendiro</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            A knowledge platform built for clarity, trust, and depth.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <reason.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-foreground">{reason.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
