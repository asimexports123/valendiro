"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/components/public/MermaidDiagram";
import { Callout, parseLabeledCallout, resolveCalloutVariant } from "@/components/reader/Callout";

function extractText(children: React.ReactNode): string {
  let text = "";
  React.Children.forEach(children, (child) => {
    if (typeof child === "string") text += child;
    else if (typeof child === "number") text += child;
    else if (React.isValidElement(child)) text += extractText((child.props as { children?: React.ReactNode }).children);
  });
  return text;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseGfmCallout(raw: string): { type: string; content: string } | null {
  const match = raw.match(/^\[!(NOTE|TIP|WARNING|DANGER|INFO|IMPORTANT|DEFINITION|EXAMPLE|DID_YOU_KNOW|BEST_PRACTICE|COMMON_MISTAKE|SUMMARY)\]\s*([\s\S]*)/i);
  if (!match) return null;
  return { type: match[1].toUpperCase().replace(/\s/g, "_"), content: match[2].trim() };
}

const PRACTICAL_APPLICATIONS_HEADING = /^(#{1,3})\s+practical applications\b/i;

function splitSection(
  content: string,
  headingPattern: RegExp
): { before: string; heading: string; body: string; after: string } | null {
  const lines = content.split("\n");
  const startIdx = lines.findIndex((line) => headingPattern.test(line));
  if (startIdx < 0) return null;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  return {
    before: lines.slice(0, startIdx).join("\n"),
    heading: lines[startIdx],
    body: lines.slice(startIdx + 1, endIdx).join("\n").trim(),
    after: lines.slice(endIdx).join("\n"),
  };
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? text.trim();
}

function smartTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (/^(ai|ml|ux|ui|api|sql|etl|seo|kpi|roi|etf|ira|401k)$/i.test(lower)) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function extractCardEntries(body: string): Array<{ title: string; summary: string }> {
  const lines = body.split("\n");
  const entries: Array<{ title: string; summary: string }> = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^(?:[-*]|\d+[.)])\s+\*\*(.+?)\*\*\s+[—-]\s+(.+)$/);
    if (bullet) {
      const title = smartTitleCase(bullet[1].replace(/[.*+?^${}()|[\]\\]/g, "").trim());
      const summary = bullet[2].trim();
      if (title && summary) entries.push({ title, summary });
      continue;
    }

    const headline = line.match(/^#{1,3}\s+(.+)$/);
    if (headline) {
      const title = smartTitleCase(headline[1].trim());
      if (title) entries.push({ title, summary: "" });
      continue;
    }
  }

  if (entries.length > 0) {
    return entries.filter((entry) => entry.title && entry.summary);
  }

  return body
    .split(/\n{2,}/)
    .map((p, index) => {
      const paragraph = p.trim();
      if (paragraph.length < 20) return null;
      const cleaned = firstSentence(paragraph)
        .replace(
          /^(applied|practical|real-world|in practice|for example|for instance|here|these|this|the focus shifts to|the section shifts to)\b[:\s,-]*/i,
          ""
        )
        .replace(/[()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const candidate = cleaned
        .split(/\s+/)
        .slice(0, 6)
        .join(" ")
        .replace(/[.,;:]+$/, "");
      return {
        title: candidate ? smartTitleCase(candidate) : `Use case ${index + 1}`,
        summary: paragraph,
      };
    })
    .filter((item): item is { title: string; summary: string } => Boolean(item));
}

function PracticalApplicationsSection({ body }: { body: string }) {
  const cards = extractCardEntries(body);
  if (cards.length === 0) return null;

  return (
    <section className="not-prose my-12 rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5 shadow-sm">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
          Practical Applications
        </div>
        <h3 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          Scan the main use cases at a glance
        </h3>
        <p className="mt-2 max-w-2xl text-sm sm:text-[0.95rem] leading-6 text-muted-foreground">
          Each card isolates one real-world situation so readers can understand the most relevant uses in a few seconds.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <article
            key={`${index}-${card.title}`}
            className="group rounded-2xl border border-border/60 bg-background/80 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.03] hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Use case
              </span>
            </div>
            <h4 className="text-base sm:text-[1.05rem] font-semibold tracking-tight text-foreground">
              {card.title}
            </h4>
            <p className="mt-2 text-sm sm:text-[0.95rem] leading-7 text-foreground/75 line-clamp-4">
              {card.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";

  if (language === "mermaid") {
    const chart = extractText(children);
    return <MermaidDiagram chart={chart} className="my-10" />;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(extractText(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-8 rounded-xl overflow-hidden border border-border/50 bg-muted/20">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/30">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-[0.8125rem] leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  const practical = splitSection(content, PRACTICAL_APPLICATIONS_HEADING);
  if (practical) {
    return (
      <div className="article-prose max-w-none">
        {practical.before.trim() ? <MarkdownContent content={practical.before} /> : null}
        <PracticalApplicationsSection body={practical.body} />
        {practical.after.trim() ? <MarkdownContent content={practical.after} /> : null}
      </div>
    );
  }

  let isFirstParagraph = true;

  return (
    <div className="article-prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = extractText(children);
            return (
              <h2 id={slugify(text)} className="scroll-mt-28 text-2xl sm:text-[1.625rem] font-bold tracking-tight text-foreground mt-14 mb-5 pb-2 border-b border-border/30">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = extractText(children);
            return (
              <h3 id={slugify(text)} className="scroll-mt-28 text-xl font-semibold tracking-tight text-foreground mt-10 mb-4">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-foreground mt-8 mb-3">{children}</h4>
          ),
          p: ({ children }) => {
            const lead = isFirstParagraph;
            isFirstParagraph = false;
            return (
              <p
                className={
                  lead
                    ? "text-lg sm:text-[1.125rem] leading-[1.75] text-foreground/90 font-medium mb-6 max-w-[42rem]"
                    : "text-[0.9375rem] sm:text-base leading-[1.8] text-foreground/80 mb-5 max-w-[42rem]"
                }
              >
                {children}
              </p>
            );
          },
          ul: ({ children }) => (
            <ul className="space-y-2.5 my-6 pl-5 list-disc marker:text-primary/40 max-w-[42rem]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2.5 my-6 pl-5 list-decimal marker:text-primary marker:font-semibold max-w-[42rem]">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[0.9375rem] sm:text-base leading-[1.75] text-foreground/80 pl-1">{children}</li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-primary font-medium underline underline-offset-[3px] decoration-primary/30 hover:decoration-primary transition-colors"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/75">{children}</em>,
          blockquote: ({ children }) => {
            const rawText = extractText(children);
            const gfm = parseGfmCallout(rawText);
            if (gfm) {
              const variant = resolveCalloutVariant(gfm.type) ?? "note";
              return <Callout variant={variant}>{gfm.content}</Callout>;
            }
            const labeled = parseLabeledCallout(rawText);
            if (labeled) {
              return <Callout variant={labeled.variant}>{labeled.content}</Callout>;
            }
            return (
              <blockquote className="border-l-[3px] border-primary/30 pl-5 my-8 italic text-foreground/70 text-base leading-relaxed max-w-[42rem]">
                {children}
              </blockquote>
            );
          },
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
            return (
              <code className="bg-muted/60 px-1.5 py-0.5 rounded-md text-[0.8125rem] font-mono text-foreground/90 border border-border/40">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="not-prose">{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-10 rounded-xl border border-border/50 shadow-sm">
              <table className="comparison-table min-w-full">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border/30">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/20 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-5 py-3.5 text-left text-xs font-bold text-foreground uppercase tracking-wider">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-5 py-3.5 text-sm text-foreground/80 leading-relaxed">{children}</td>
          ),
          hr: () => <hr className="my-12 border-0 h-px bg-border/50" />,
          img: ({ src, alt }) => (
            <figure className="my-10 not-prose">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src ?? ""} alt={alt ?? ""} className="rounded-xl border border-border/50 max-w-full h-auto mx-auto" loading="lazy" />
              {alt && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{alt}</figcaption>}
            </figure>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
