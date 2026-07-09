/**
 * Markdown Serializer
 *
 * Serializes a Document Tree into clean Markdown.
 * Pure function. No side effects.
 */

import type { DocumentNode, InlineNode, CitationBlockNode } from "../types";

export function serializeToMarkdown(tree: DocumentNode[]): string {
  const lines: string[] = [];

  for (const node of tree) {
    const rendered = renderNode(node);
    if (rendered) lines.push(rendered);
  }

  return lines.join("\n\n");
}

function renderNode(node: DocumentNode): string {
  switch (node.type) {
    case "heading":
      return `${"#".repeat(node.level)} ${node.text}`;

    case "paragraph":
      return renderInlineNodes(node.children);

    case "list":
      return node.items
        .map((item, i) => {
          const prefix = node.ordered ? `${i + 1}. ` : "- ";
          return `${prefix}${renderInlineNodes(item.children)}`;
        })
        .join("\n");

    case "code-block":
      return `\`\`\`${node.language}\n${node.code}\n\`\`\``;

    case "blockquote":
      return node.children
        .map((child) => {
          const inner = renderNode(child);
          return inner.split("\n").map((line) => `> ${line}`).join("\n");
        })
        .join("\n");

    case "table":
      return renderTable(node.headers, node.rows);

    case "citation-ref":
      return `[${node.index}]`;

    case "citation-block":
      return renderCitationBlock(node);

    case "internal-link":
      return `[${node.text}](/topics/${node.targetSlug})`;

    case "divider":
      return "---";

    case "image-placeholder":
      return `![${node.altText}](placeholder-${node.suggestedType})`;

    case "metadata":
    case "missing-knowledge":
    case "commercial-placeholder":
      return "";

    case "callout": {
      const bodyLines = node.children.flatMap((child) => {
        const rendered = renderNode(child);
        return rendered ? rendered.split("\n").filter(Boolean) : [];
      });
      const prefix = node.title ? `**${node.title}:** ` : "";
      return `> ${prefix}${bodyLines.join(" ")}`.trim();
    }

    case "table-of-contents":
      const tocLines = node.entries.map((e) => `- [${e.text}](#${e.anchor})`).join("\n");
      return `## Contents\n\n${tocLines}`;

    case "summary":
      const keyLines = node.keyPoints.map((p) => `- ${p}`).join("\n");
      return `## Key Takeaways\n\n${keyLines}\n\n${node.closingSentence}`;

    default:
      return "";
  }
}

function renderInlineNodes(nodes: InlineNode[]): string {
  return nodes.map(renderInline).join("");
}

function renderInline(node: InlineNode): string {
  if (typeof node === "string") return node;
  switch (node.type) {
    case "bold":
      return `**${node.text}**`;
    case "italic":
      return `*${node.text}*`;
    case "code":
      return `\`${node.text}\``;
    case "citation-ref":
      return `[${node.index}]`;
    case "internal-link":
      return `[${node.text}](/topics/${node.targetSlug})`;
    default:
      return "";
  }
}

function renderTable(headers: string[], rows: string[][]): string {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyLines = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${headerLine}\n${separator}\n${bodyLines}`;
}

function renderCitationBlock(node: CitationBlockNode): string {
  return node.entries
    .map((entry) => {
      const url = entry.sourceUrl ? ` — [source](${entry.sourceUrl})` : "";
      return `[${entry.index}] ${entry.sourceName} (${entry.authority})${url}`;
    })
    .join("\n");
}
