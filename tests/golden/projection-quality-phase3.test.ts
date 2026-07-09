/**
 * Golden tests — Phase 3 Knowledge Projection Quality Engine
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateProjectionPage } from "../../services/renderer/productionQAEnforcement";
import type { DocumentNode, PluginFact } from "../../services/renderer/types";
import { KnowledgeComposer } from "../../services/renderer/composition/knowledgeComposer";

const sampleFacts: PluginFact[] = [
  {
    id: "f1",
    statement: "JavaScript is a dynamic programming language used for web development.",
    factType: "definition",
    confidence: "verified",
    domain: "technology",
    scope: "general",
    tags: [],
  },
  {
    id: "f2",
    statement: "Variables store values using let, const, or var declarations.",
    factType: "property",
    confidence: "verified",
    domain: "technology",
    scope: "general",
    tags: [],
  },
  {
    id: "f3",
    statement: "Functions encapsulate reusable logic and accept parameters.",
    factType: "procedural",
    confidence: "verified",
    domain: "technology",
    scope: "general",
    tags: [],
  },
  {
    id: "f4",
    statement: "Using var in block scope can cause unexpected hoisting bugs.",
    factType: "warning",
    confidence: "verified",
    domain: "technology",
    scope: "general",
    tags: [],
  },
];

describe("Phase 3 projection quality", () => {
  it("validateProjectionPage rejects duplicate headings", () => {
    const tree: DocumentNode[] = [
      { type: "heading", level: 2, text: "Overview", anchor: "a" },
      { type: "paragraph", children: ["First section with enough content to pass empty check easily."] },
      { type: "heading", level: 2, text: "Overview", anchor: "b" },
      { type: "paragraph", children: ["Second section also has sufficient unique content here."] },
    ];
    const metrics = validateProjectionPage(tree, sampleFacts);
    assert.equal(metrics.duplicateHeadings, 1);
    assert.equal(metrics.passed, false);
  });

  it("validateProjectionPage rejects placeholder patterns", () => {
    const tree: DocumentNode[] = [
      { type: "heading", level: 2, text: "Intro", anchor: "intro" },
      {
        type: "paragraph",
        children: ["In today's rapidly evolving tech landscape, this is filler content for testing."],
      },
    ];
    const metrics = validateProjectionPage(tree, sampleFacts);
    assert.ok(metrics.placeholderHits > 0);
    assert.equal(metrics.passed, false);
  });

  it("KnowledgeComposer builds sections only from available facts", () => {
    const composer = new KnowledgeComposer();
    const result = composer.compose(sampleFacts, {
      rendererId: "long-article-v2-v5.0.0",
      rendererVersion: "5.0.0",
      templateVersion: "1.0.0",
      format: "html",
      style: ["intermediate"],
      slug: "javascript-fundamentals",
      category: "technology",
      intent: "educate",
    });

    assert.ok(result.sections.length >= 2);
    assert.ok(result.sections.every((s) => s.content.length > 0));
    const headings = result.sections.map((s) => s.heading.toLowerCase());
    assert.ok(!headings.includes("why it matters"));
    assert.ok(!headings.includes("what to learn next"));
    assert.ok(!headings.includes("overview"));
    assert.ok(!headings.includes("key points"));
  });

  it("orchestrator defaults to long-article-v2", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("services/renderer/orchestrator.ts", "utf-8");
    assert.match(src, /rendererId = request\.rendererId \?\? "long-article-v2"/);
    assert.match(src, /CANONICAL_OUTPUT_FORMAT/);
    assert.match(src, /validateProjectionPage/);
  });

  it("canonical serializer excludes metadata and HTML comments", async () => {
    const { serializeCanonicalProjection, validateCanonicalContent } = await import(
      "../../services/renderer/serializers/canonical"
    );
    const tree = [
      { type: "metadata" as const, key: "reading-time", value: "5" },
      { type: "heading" as const, level: 1, text: "Title", anchor: "title" },
      { type: "heading" as const, level: 2, text: "Overview", anchor: "overview" },
      { type: "paragraph" as const, children: ["Real fact content about the topic here."] },
    ];
    const md = serializeCanonicalProjection(tree);
    assert.ok(!md.includes("<!--"));
    assert.ok(!md.includes("# Title"));
    assert.match(md, /## Overview/);
    const check = validateCanonicalContent(md);
    assert.equal(check.valid, true);
  });
});
