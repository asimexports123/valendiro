"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CALLOUT_TYPES: Record<string, { label: string }> = {
  NOTE: { label: "Note" },
  TIP: { label: "Tip" },
  WARNING: { label: "Warning" },
  DANGER: { label: "Important" },
  INFO: { label: "Info" },
  BEST_PRACTICE: { label: "Best Practice" },
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
    <div className="relative my-12 rounded-lg overflow-hidden border border-border/40">
      <div className="flex items-center justify-between px-4 py-3 bg-foreground/[0.02] border-b border-border/40">
        <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground/50 hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-foreground/5"
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
      <pre className="bg-foreground/[0.02] p-6 overflow-x-auto text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-[1.8] prose-p:text-lg prose-p:text-foreground/80 prose-p:my-6 prose-ul:my-6 prose-ol:my-6 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return (
              <h2 id={id} className="scroll-mt-32 text-3xl font-bold tracking-tight text-foreground mt-16 mb-8">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return (
              <h3 id={id} className="scroll-mt-32 text-2xl font-bold tracking-tight text-foreground mt-12 mb-6">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => <h4 className="text-xl font-bold text-foreground mt-10 mb-5">{children}</h4>,
          p: ({ children }) => <p className="leading-[1.8] text-lg text-foreground/80 my-6">{children}</p>,
          ul: ({ children }) => <ul className="space-y-3 my-6 pl-6 list-disc marker:text-foreground/30">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-3 my-6 pl-6 list-decimal marker:text-foreground/30 marker:font-semibold">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.8] text-foreground/80">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-foreground hover:text-foreground/60 underline underline-offset-4 transition-colors">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
          blockquote: ({ children }) => {
            const rawText = extractText(children);
            const callout = parseCallout(rawText);
            if (callout) {
              const meta = CALLOUT_TYPES[callout.type] || CALLOUT_TYPES.NOTE;
              return (
                <div className="my-12 rounded-lg border border-border/40 p-6 bg-foreground/[0.02]">
                  <p className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-3">{meta.label}</p>
                  <p className="text-base text-foreground/70 leading-relaxed">{callout.content}</p>
                </div>
              );
            }
            return (
              <blockquote className="border-l-2 border-foreground/20 pl-6 my-12 italic text-foreground/60 text-lg">
                {children}
              </blockquote>
            );
          },
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
            return <code className="bg-foreground/[0.03] px-2 py-1 rounded text-sm font-mono text-foreground/80 border border-border/40">{children}</code>;
          },
          pre: ({ children }) => <pre>{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-12 rounded-lg border border-border/40">
              <table className="min-w-full divide-y divide-border/40">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-foreground/[0.02]">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border/30">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-foreground/[0.01] transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-6 py-4 text-base text-foreground/70 leading-relaxed">{children}</td>,
          hr: () => <hr className="my-16 border-border/30" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
