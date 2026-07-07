"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CALLOUT_TYPES: Record<string, { icon: string; bg: string; border: string; iconBg: string; label: string }> = {
  NOTE:    { icon: "ℹ️", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800", iconBg: "bg-blue-100 dark:bg-blue-900/30", label: "Note" },
  TIP:     { icon: "💡", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800", iconBg: "bg-amber-100 dark:bg-amber-900/30", label: "Tip" },
  WARNING: { icon: "⚠️", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800", iconBg: "bg-orange-100 dark:bg-orange-900/30", label: "Warning" },
  DANGER:  { icon: "🚨", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800", iconBg: "bg-red-100 dark:bg-red-900/30", label: "Important" },
  INFO:    { icon: "ℹ️", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800", iconBg: "bg-blue-100 dark:bg-blue-900/30", label: "Info" },
  BEST_PRACTICE: { icon: "✨", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", label: "Best Practice" },
};

function parseCallout(raw: string): { type: string; content: string } | null {
  const match = raw.match(/^\[!(NOTE|TIP|WARNING|DANGER|INFO|BEST_PRACTICE)\]\s*([\s\S]*)/i);
  if (!match) return null;
  return { type: match[1].toUpperCase(), content: match[2].trim() };
}

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

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "javascript";

  const handleCopy = async () => {
    const codeText = extractText(children);
    await navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-8 rounded-xl overflow-hidden border border-border/60 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-border/60">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-[#1e1e1e] p-5 overflow-x-auto text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-[1.75] prose-p:text-base prose-p:text-foreground/90 prose-p:my-5 prose-ul:my-5 prose-ol:my-5 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return (
              <h2 id={id} className="scroll-mt-28 text-2xl font-bold tracking-tight text-foreground mt-12 mb-6 flex items-center gap-3">
                <span className="flex-1">{children}</span>
                <a href={`#${id}`} className="opacity-0 hover:opacity-100 text-muted-foreground hover:text-primary transition-all text-lg no-underline">
                  #
                </a>
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return (
              <h3 id={id} className="scroll-mt-28 text-xl font-bold tracking-tight text-foreground mt-10 mb-5 flex items-center gap-3">
                <span className="flex-1">{children}</span>
                <a href={`#${id}`} className="opacity-0 hover:opacity-100 text-muted-foreground hover:text-primary transition-all text-base no-underline">
                  #
                </a>
              </h3>
            );
          },
          h4: ({ children }) => <h4 className="text-lg font-bold text-foreground mt-8 mb-4">{children}</h4>,
          p: ({ children }) => <p className="leading-[1.75] text-base text-foreground/90 my-5">{children}</p>,
          ul: ({ children }) => <ul className="space-y-3 my-5 pl-6 list-disc marker:text-primary/60 marker:text-lg">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-3 my-5 pl-6 list-decimal marker:text-primary/60 marker:text-lg font-semibold">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.75] text-foreground/90">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-2 hover:decoration-primary/40 transition-all font-medium">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
          blockquote: ({ children }) => {
            const rawText = extractText(children);
            const callout = parseCallout(rawText);
            if (callout) {
              const meta = CALLOUT_TYPES[callout.type] || CALLOUT_TYPES.NOTE;
              return (
                <div className={`${meta.bg} ${meta.border} my-8 rounded-xl border p-5 flex gap-4 shadow-sm`}>
                  <span className={`flex-shrink-0 w-10 h-10 rounded-lg ${meta.iconBg} flex items-center justify-center text-xl`}>
                    {meta.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">{meta.label}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{callout.content}</p>
                  </div>
                </div>
              );
            }
            return (
              <blockquote className="border-l-4 border-primary/50 pl-5 my-8 italic text-foreground/70 bg-muted/30 py-4 pr-4 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
            return <code className="bg-muted/70 px-2 py-1 rounded-md text-sm font-mono text-foreground/90 border border-border/50 font-medium">{children}</code>;
          },
          pre: ({ children }) => <pre>{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-8 rounded-xl border border-border/60 shadow-sm">
              <table className="min-w-full divide-y divide-border/60">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border/40 bg-background/50">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-5 py-4 text-left text-sm font-bold text-foreground uppercase tracking-wide">{children}</th>,
          td: ({ children }) => <td className="px-5 py-4 text-sm text-foreground/90 leading-relaxed">{children}</td>,
          hr: () => <hr className="my-12 border-border/40" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
