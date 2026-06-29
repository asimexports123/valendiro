"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => {
          const text = extractText(children);
          const id = slugify(text);
          return <h2 id={id} className="text-2xl font-semibold tracking-tight text-foreground mt-12 mb-4 scroll-mt-24">{children}</h2>;
        },
        h3: ({ children }) => {
          const text = extractText(children);
          const id = slugify(text);
          return <h3 id={id} className="text-xl font-semibold tracking-tight text-foreground mt-8 mb-3 scroll-mt-24">{children}</h3>;
        },
        p: ({ children }) => <p className="text-muted-foreground leading-7 mb-5">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 mb-5 text-muted-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 mb-5 text-muted-foreground">{children}</ol>,
        li: ({ children }) => <li className="leading-7">{children}</li>,
        a: ({ children, href }) => (
          <a href={href} className="text-accent hover:underline font-medium">
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-5 italic text-muted-foreground mb-5">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="rounded-xl bg-muted p-4 overflow-x-auto text-sm font-mono text-foreground mb-5">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function extractText(children: React.ReactNode): string {
  let text = "";
  React.Children.forEach(children, (child) => {
    if (typeof child === "string") text += child;
    else if (typeof child === "number") text += child;
  });
  return text;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
