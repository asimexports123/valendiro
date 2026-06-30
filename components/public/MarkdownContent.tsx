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
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h2 id={id} className="scroll-mt-24">{children}</h2>;
          },
          h3: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h3 id={id} className="scroll-mt-24">{children}</h3>;
          },
          h4: ({ children }) => <h4 className="text-base font-semibold text-foreground mt-6 mb-2">{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>
              {children}
            </a>
          ),
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => {
            const rawText = extractText(children);
            const callout = parseCallout(rawText);
            if (callout) {
              const meta = CALLOUT_TYPES[callout.type] || CALLOUT_TYPES.NOTE;
              return (
                <div className={meta.cls}>
                  <span className="text-xl shrink-0 mt-0.5">{meta.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">{meta.label}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{callout.content}</p>
                  </div>
                </div>
              );
            }
            return <blockquote>{children}</blockquote>;
          },
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) return <code className={className}>{children}</code>;
            return <code>{children}</code>;
          },
          pre: ({ children }) => <pre>{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-8 rounded-xl border border-border">
              <table className="!my-0">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          hr: () => <hr />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
