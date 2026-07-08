import type { ProcessSteps } from "@/lib/reader/contentParser";

interface StepFlowDiagramProps {
  data: ProcessSteps;
}

/** Clean SVG process flow from numbered steps in article content. */
export function StepFlowDiagram({ data }: StepFlowDiagramProps) {
  if (data.steps.length < 2) return null;

  const steps = data.steps.slice(0, 6);
  const boxH = 44;
  const gap = 28;
  const pad = 24;
  const w = 320;
  const h = pad * 2 + steps.length * boxH + (steps.length - 1) * gap;

  return (
    <figure className="my-10 not-prose" aria-label={`Process diagram: ${data.title}`}>
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {data.title}
      </figcaption>
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="mx-auto max-w-full"
          role="img"
          aria-label={`Step-by-step: ${steps.join(", ")}`}
        >
          {steps.map((step, i) => {
            const y = pad + i * (boxH + gap);
            const label = step.length > 42 ? `${step.slice(0, 40)}…` : step;
            return (
              <g key={i}>
                {i > 0 && (
                  <line
                    x1={w / 2}
                    y1={y - gap + 4}
                    x2={w / 2}
                    y2={y - 4}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="text-border"
                    markerEnd="url(#arrow)"
                  />
                )}
                <rect
                  x={pad}
                  y={y}
                  width={w - pad * 2}
                  height={boxH}
                  rx={8}
                  className="fill-muted/60 stroke-border"
                  strokeWidth={1}
                />
                <circle cx={pad + 20} cy={y + boxH / 2} r={12} className="fill-primary/10 stroke-primary/40" strokeWidth={1} />
                <text x={pad + 20} y={y + boxH / 2 + 4} textAnchor="middle" className="fill-primary text-[11px] font-bold">
                  {i + 1}
                </text>
                <text x={pad + 44} y={y + boxH / 2 + 4} className="fill-foreground text-[12px]">
                  {label}
                </text>
              </g>
            );
          })}
          <defs>
            <marker id="arrow" markerWidth={6} markerHeight={6} refX={3} refY={3} orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="fill-border" />
            </marker>
          </defs>
        </svg>
      </div>
    </figure>
  );
}
