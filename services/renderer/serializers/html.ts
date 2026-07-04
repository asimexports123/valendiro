/**
 * HTML Serializer
 *
 * Serializes a Document Tree into clean, semantic HTML.
 * Pure function. No side effects.
 */

import type { DocumentNode, InlineNode, CitationBlockNode } from "../types";

export function serializeToHTML(tree: DocumentNode[]): string {
  const lines: string[] = [];
  lines.push('<!DOCTYPE html>');
  lines.push('<article class="knowledge-article">');

  for (const node of tree) {
    lines.push(renderNode(node));
  }

  lines.push('</article>');
  return lines.join("\n");
}

function renderNode(node: DocumentNode): string {
  switch (node.type) {
    case "heading":
      return `<h${node.level} id="${escapeAttr(node.anchor)}">${escapeHTML(node.text)}</h${node.level}>`;

    case "paragraph":
      return `<p>${renderInlineNodes(node.children)}</p>`;

    case "list":
      const tag = node.ordered ? "ol" : "ul";
      const items = node.items.map((item) => `<li>${renderInlineNodes(item.children)}</li>`).join("\n");
      return `<${tag}>\n${items}\n</${tag}>`;

    case "code-block":
      return `<pre><code class="language-${escapeAttr(node.language)}">${escapeHTML(node.code)}</code></pre>`;

    case "blockquote":
      const inner = node.children.map(renderNode).join("\n");
      return `<blockquote>\n${inner}\n</blockquote>`;

    case "table":
      return renderTable(node.headers, node.rows);

    case "citation-ref":
      return `<sup class="citation-ref">[${node.index}]</sup>`;

    case "citation-block":
      return renderCitationBlock(node);

    case "internal-link":
      return `<a href="/topics/${escapeAttr(node.targetSlug)}" class="internal-link" data-relationship="${escapeAttr(node.relationship)}">${escapeHTML(node.text)}</a>`;

    case "divider":
      return "<hr />";

    case "metadata":
      return `<!-- ${escapeHTML(node.key)}: ${escapeHTML(node.value)} -->`;

    case "missing-knowledge":
      // Stripped in production — only visible in preview
      return `<!-- MISSING: ${escapeHTML(node.expectedFactType)} (${node.severity}) — ${escapeHTML(node.sectionName)} -->`;

    case "image-placeholder":
      return `<figure class="image-placeholder" data-type="${escapeAttr(node.suggestedType)}" data-width="${escapeAttr(node.width)}"><figcaption>${escapeHTML(node.altText)}</figcaption></figure>`;

    case "commercial-placeholder":
      return `<div class="commercial-placeholder" data-placement="${escapeAttr(node.placement)}" data-category="${escapeAttr(node.category)}"></div>`;

    case "callout":
      const calloutInner = node.children.map(renderNode).join("\n");
      const calloutTitle = node.title ? `<strong class="callout-title">${escapeHTML(node.title)}</strong>\n` : "";
      return `<aside class="callout callout-${escapeAttr(node.variant)}" role="note">\n${calloutTitle}${calloutInner}\n</aside>`;

    case "table-of-contents":
      const tocItems = node.entries.map((e) => `<li><a href="#${escapeAttr(e.anchor)}">${escapeHTML(e.text)}</a></li>`).join("\n");
      return `<nav class="table-of-contents" aria-label="Table of contents">\n<h2 id="contents">Contents</h2>\n<ol>\n${tocItems}\n</ol>\n</nav>`;

    case "summary":
      const points = node.keyPoints.map((p) => `<li>${escapeHTML(p)}</li>`).join("\n");
      return `<section class="summary" aria-label="Key takeaways">\n<h2 id="summary">Key Takeaways</h2>\n<ul>\n${points}\n</ul>\n<p class="closing">${escapeHTML(node.closingSentence)}</p>\n</section>`;

    case "quick-summary":
      const quickSummaryContent = node.content.map((c) => `<p>${escapeHTML(c)}</p>`).join("\n");
      return `<div class="summary-box">\n<h3>Quick Summary</h3>\n${quickSummaryContent}\n</div>`;

    case "key-takeaways":
      const keyTakeawayItems = node.items.map((item) => `<li>${escapeHTML(item)}</li>`).join("\n");
      return `<div class="takeaways-box">\n<h3>Key Takeaways</h3>\n<ul>\n${keyTakeawayItems}\n</ul>\n</div>`;

    case "pro-tip":
      const proTipContext = node.context ? `<p class="tip-context">${escapeHTML(node.context)}</p>` : "";
      return `<div class="pro-tip">\n<h4>💡 Pro Tip</h4>\n${proTipContext}\n<p>${escapeHTML(node.content)}</p>\n</div>`;

    case "did-you-know":
      return `<div class="did-you-know">\n<h4>🧠 Did You Know?</h4>\n<p>${escapeHTML(node.fact)}</p>\n</div>`;

    case "common-mistake":
      return `<div class="common-mistake">\n<h4>⚠️ Common Mistake</h4>\n<p><strong>Mistake:</strong> ${escapeHTML(node.mistake)}</p>\n<p><strong>Correction:</strong> ${escapeHTML(node.correction)}</p>\n</div>`;

    case "expert-insight":
      const expertSource = node.source ? `<p class="expert-source">— ${escapeHTML(node.source)}</p>` : "";
      return `<div class="expert-insight">\n<h4>🎓 Expert Insight</h4>\n<p>${escapeHTML(node.insight)}</p>\n${expertSource}\n</div>`;

    case "remember-this":
      return `<div class="remember-this">\n<h4>📌 Remember This</h4>\n<p>${escapeHTML(node.point)}</p>\n</div>`;

    case "comparison-table":
      const compTableHeaders = `<tr>${node.headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr>`;
      const compTableRows = node.items.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong></td>${item.values.map(v => `<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join("\n");
      return `<div class="comparison-table">\n<h3>Comparison</h3>\n<table>\n<thead>${compTableHeaders}</thead>\n<tbody>${compTableRows}</tbody>\n</table>\n</div>`;

    case "pros-cons":
      const prosList = node.pros.map(p => `<li>${escapeHTML(p)}</li>`).join("\n");
      const consList = node.cons.map(c => `<li>${escapeHTML(c)}</li>`).join("\n");
      return `<div class="pros-cons">\n<h3>Pros & Cons</h3>\n<div class="pros-section">\n<h4>✅ Pros</h4>\n<ul>${prosList}</ul>\n</div>\n<div class="cons-section">\n<h4>❌ Cons</h4>\n<ul>${consList}</ul>\n</div>\n</div>`;

    case "checklist":
      const checklistItems = node.items.map(item => `<li class="${item.checked ? 'checked' : ''}">${escapeHTML(item.text)}</li>`).join("\n");
      return `<div class="checklist">\n<h3>Checklist</h3>\n<ul>${checklistItems}</ul>\n</div>`;

    case "timeline":
      const timelineEvents = node.events.map(event => {
        const date = event.date ? `<span class="timeline-date">${escapeHTML(event.date)}</span>` : "";
        return `<div class="timeline-event">\n${date}\n<h4>${escapeHTML(event.title)}</h4>\n<p>${escapeHTML(event.description)}</p>\n</div>`;
      }).join("\n");
      return `<div class="timeline">\n<h3>Timeline</h3>\n${timelineEvents}\n</div>`;

    case "framework-box":
      const frameworkDesc = node.description ? `<p>${escapeHTML(node.description)}</p>` : "";
      const frameworkComponents = node.components.map(c => `<li>${escapeHTML(c)}</li>`).join("\n");
      return `<div class="framework-box">\n<h3>${escapeHTML(node.title)}</h3>\n${frameworkDesc}\n<ul>${frameworkComponents}</ul>\n</div>`;

    default:
      return "";
  }
}

function renderInlineNodes(nodes: InlineNode[]): string {
  return nodes.map(renderInline).join("");
}

function renderInline(node: InlineNode): string {
  if (typeof node === "string") return escapeHTML(node);
  switch (node.type) {
    case "bold":
      return `<strong>${escapeHTML(node.text)}</strong>`;
    case "italic":
      return `<em>${escapeHTML(node.text)}</em>`;
    case "code":
      return `<code>${escapeHTML(node.text)}</code>`;
    case "citation-ref":
      return `<sup class="citation-ref">[${node.index}]</sup>`;
    case "internal-link":
      return `<a href="/topics/${escapeAttr(node.targetSlug)}" class="internal-link">${escapeHTML(node.text)}</a>`;
    default:
      return "";
  }
}

function renderTable(headers: string[], rows: string[][]): string {
  const thead = `<thead><tr>${headers.map((h) => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${escapeHTML(c)}</td>`).join("")}</tr>`).join("\n")}</tbody>`;
  return `<table>\n${thead}\n${tbody}\n</table>`;
}

function renderCitationBlock(node: CitationBlockNode): string {
  const items = node.entries.map((entry) => {
    const link = entry.sourceUrl
      ? `<a href="${escapeAttr(entry.sourceUrl)}" rel="noopener" target="_blank">${escapeHTML(entry.sourceName)}</a>`
      : escapeHTML(entry.sourceName);
    return `<li id="cite-${entry.index}"><span class="cite-index">[${entry.index}]</span> ${link} <span class="cite-authority">(${escapeHTML(entry.authority)})</span></li>`;
  });
  return `<ol class="citation-list">\n${items.join("\n")}\n</ol>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
