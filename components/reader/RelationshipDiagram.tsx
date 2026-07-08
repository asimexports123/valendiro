interface EntityNode {
  slug: string;
  name: string;
}

interface RelationshipDiagramProps {
  topicTitle: string;
  entities: EntityNode[];
}

/** Hub-and-spoke SVG showing key concepts linked to the topic. */
export function RelationshipDiagram({ topicTitle, entities }: RelationshipDiagramProps) {
  const nodes = entities.slice(0, 6);
  if (nodes.length < 2) return null;

  const cx = 160;
  const cy = 120;
  const radius = 72;
  const w = 320;
  const h = 240;

  const positions = nodes.map((_, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  return (
    <figure className="my-10 not-prose" aria-label="Concept relationship diagram">
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Key concepts
      </figcaption>
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto max-w-full" role="img">
          {positions.map((pos, i) => (
            <line
              key={`line-${i}`}
              x1={cx}
              y1={cy}
              x2={pos.x}
              y2={pos.y}
              stroke="currentColor"
              strokeWidth={1}
              className="text-border/80"
              strokeDasharray="4 3"
            />
          ))}
          <circle cx={cx} cy={cy} r={36} className="fill-primary/10 stroke-primary/30" strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">
            {topicTitle.length > 18 ? `${topicTitle.slice(0, 16)}…` : topicTitle}
          </text>
          {nodes.map((node, i) => {
            const pos = positions[i];
            const label = node.name.length > 14 ? `${node.name.slice(0, 12)}…` : node.name;
            return (
              <g key={node.slug}>
                <rect
                  x={pos.x - 44}
                  y={pos.y - 14}
                  width={88}
                  height={28}
                  rx={6}
                  className="fill-muted/70 stroke-border"
                  strokeWidth={1}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="fill-foreground/80 text-[10px]">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
