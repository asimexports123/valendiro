"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CALLOUT_TYPES: Record<string, { icon: string; cls: string; label: string }> = {
  NOTE:    { icon: "ℹ️", cls: "callout callout-info",    label: "Note" },
  TIP:     { icon: "💡", cls: "callout callout-tip",     label: "Tip" },
  WARNING: { icon: "⚠️", cls: "callout callout-warning", label: "Warning" },
  DANGER:  { icon: "🚨", cls: "callout callout-danger",  label: "Important" },
  INFO:    { icon: "ℹ️", cls: "callout callout-info",    label: "Info" },
};

function parseCallout(raw: string): { type: string; content: string } | null {
  const match = raw.match(/^\[!(NOTE|TIP|WARNING|DANGER|INFO)\]\s*([\s\S]*)/i);
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

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-base prose-p:text-foreground/90 prose-p:my-4 prose-ul:my-4 prose-ol:my-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground mt-8 mb-4">{children}</h2>;
          },
          h3: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h3 id={id} className="scroll-mt-24 text-xl font-semibold tracking-tight text-foreground mt-6 mb-3">{children}</h3>;
          },
          h4: ({ children }) => <h4 className="text-lg font-semibold text-foreground mt-5 mb-2">{children}</h4>,
          p: ({ children }) => <p className="leading-relaxed text-base text-foreground/90 my-4">{children}</p>,
          ul: ({ children }) => <ul className="space-y-2 my-4 pl-6 list-disc marker:text-foreground/50">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-2 my-4 pl-6 list-decimal marker:text-foreground/50">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-foreground/90">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-primary hover:underline underline-offset-4">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
          blockquote: ({ children }) => {
            const rawText = extractText(children);
            const callout = parseCallout(rawText);
            if (callout) {
              const meta = CALLOUT_TYPES[callout.type] || CALLOUT_TYPES.NOTE;
              return (
                <div className={`${meta.cls} my-6 rounded-xl border p-4 flex gap-3`}>
                  <span className="text-xl shrink-0 mt-0.5">{meta.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">{meta.label}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{callout.content}</p>
                  </div>
                </div>
              );
            }
            return <blockquote className="border-l-4 border-primary/30 pl-4 my-6 italic text-foreground/70">{children}</blockquote>;
          },
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) return <code className={className}>{children}</code>;
            return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground/90">{children}</code>;
          },
          pre: ({ children }) => <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto my-6 border border-border/50">{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/30">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/20">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-sm text-foreground/90">{children}</td>,
          hr: () => <hr className="my-8 border-border/50" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
