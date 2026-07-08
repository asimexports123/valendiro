"use client";

import { MermaidDiagram } from "@/components/public/MermaidDiagram";

interface TopicDiagramProps {
  slug: string;
  content: string;
}

/** Only render diagrams that teach — slug allowlist + content must support it. Max one per page. */
export function TopicDiagram({ slug, content }: TopicDiagramProps) {
  const lower = content.toLowerCase();

  if (slug === "design-patterns") {
    const hasTaxonomy =
      lower.includes("creational") ||
      lower.includes("structural") ||
      lower.includes("behavioral") ||
      lower.includes("design pattern");
    if (!hasTaxonomy) return null;

    const chart = `flowchart TB
  DP["Design Patterns"]
  DP --> CR["Creational"]
  DP --> ST["Structural"]
  DP --> BE["Behavioral"]
  CR --> CR1["Factory / Builder"]
  ST --> ST1["Adapter / Decorator"]
  BE --> BE1["Observer / Strategy"]`;

    return (
      <figure className="my-10 not-prose" aria-label="Design pattern taxonomy">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Pattern taxonomy
        </figcaption>
        <MermaidDiagram chart={chart} />
      </figure>
    );
  }

  if (slug === "index-funds") {
    if (!lower.includes("index fund") && !lower.includes("passive")) return null;
    const chart = `flowchart LR
  IF["Index Fund"] --> T["Tracks market index"]
  IF --> AF["Active Fund"]
  AF --> PM["Fund manager picks stocks"]
  IF --> LC["Lower cost / passive"]`;

    return (
      <figure className="my-10 not-prose" aria-label="Index fund vs active fund">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Index vs active investing
        </figcaption>
        <MermaidDiagram chart={chart} />
      </figure>
    );
  }

  if (slug === "git-version-control") {
    if (!lower.includes("commit") && !lower.includes("branch") && !lower.includes("git")) return null;
    const chart = `flowchart LR
  WC["Working copy"] --> ST["git add / stage"]
  ST --> CM["git commit"]
  CM --> RE["Repository history"]
  RE --> BR["Branches"]`;

    return (
      <figure className="my-10 not-prose" aria-label="Git basic workflow">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Basic Git workflow
        </figcaption>
        <MermaidDiagram chart={chart} />
      </figure>
    );
  }

  return null;
}
