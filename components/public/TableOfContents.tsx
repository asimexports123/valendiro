"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0% -70% 0%", threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="mb-4 pb-3 border-b border-border/40">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Contents
        </p>
      </div>
      <ol className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActive(h.id);
              }}
              className={`block rounded-lg py-2 px-3 text-sm transition-all duration-200 leading-snug border border-transparent
                ${h.level === 3 ? "pl-6" : "pl-3"}
                ${active === h.id
                  ? "bg-primary/5 border-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
