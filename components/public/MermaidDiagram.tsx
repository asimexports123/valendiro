"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, chart.trim());

        if (!cancelled) {
          setSvg(rendered);
          setError("");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to render diagram");
          setSvg("");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-700 dark:text-amber-300 ${className}`}>
        <p className="font-medium">Diagram could not be rendered</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-border bg-muted/30 p-8 ${className}`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-card/50 p-4 shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
