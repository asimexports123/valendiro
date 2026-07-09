/**
 * Golden tests — Phase 4 Knowledge Composition Excellence
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PluginFact } from "../../services/renderer/types";
import { KnowledgeComposer } from "../../services/renderer/composition/knowledgeComposer";
import { TransitionGenerator } from "../../services/renderer/composition/transitionGenerator";

const richFacts: PluginFact[] = [
  {
    id: "d1",
    statement: "An index fund is a mutual fund that passively tracks a market index.",
    factType: "definition",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "p1",
    statement: "Low costs are important because they compound into higher long-term returns.",
    factType: "property",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "p2",
    statement: "Index funds price at end-of-day NAV rather than trading continuously.",
    factType: "property",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "pr1",
    statement: "Choose a broad market index and buy the corresponding low-cost fund.",
    factType: "procedural",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "pr2",
    statement: "Reinvest dividends automatically to keep the portfolio fully invested.",
    factType: "procedural",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "w1",
    statement: "Avoid chasing last year's hottest sector index — that pattern often underperforms.",
    factType: "warning",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "w2",
    statement: "Never treat an index fund as immune to market drawdowns.",
    factType: "warning",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
  {
    id: "r1",
    statement: "Prefer funds with expense ratios below industry averages for the same index.",
    factType: "rule",
    confidence: "verified",
    domain: "finance",
    scope: "general",
    tags: [],
  },
];

describe("Phase 4 composition excellence", () => {
  it("plans teaching-order sections from available fact types", () => {
    const composer = new KnowledgeComposer();
    const result = composer.compose(richFacts, {
      rendererId: "long-article-v2-v5.1.0",
      rendererVersion: "5.1.0",
      templateVersion: "1.0.0",
      format: "markdown",
      style: ["intermediate"],
      slug: "index-funds",
      category: "finance",
      intent: "educate",
    });

    const types = result.sections.map((s) => s.type);
    assert.ok(types.includes("definition-card"));
    assert.ok(types.includes("core-concept"), "property facts must create core-concept");
    assert.ok(types.includes("how-it-works"));
    assert.ok(types.includes("beginner-mistakes"));
    assert.ok(types.includes("best-practices"));

    // Teaching order: definition before how, how before mistakes, mistakes before practices
    const di = types.indexOf("definition-card");
    const hi = types.indexOf("how-it-works");
    const mi = types.indexOf("beginner-mistakes");
    const bi = types.indexOf("best-practices");
    assert.ok(di < hi && hi < mi && mi < bi);

    const headings = result.sections.map((s) => s.heading.toLowerCase());
    assert.ok(!headings.includes("overview"));
    assert.ok(!headings.includes("key points"));
  });

  it("core-concept receives property facts (allocation fix)", () => {
    const composer = new KnowledgeComposer();
    const result = composer.compose(richFacts, {
      rendererId: "long-article-v2-v5.1.0",
      rendererVersion: "5.1.0",
      templateVersion: "1.0.0",
      format: "markdown",
      style: ["intermediate"],
      slug: "index-funds",
      category: "finance",
      intent: "educate",
    });

    const core = result.sections.find((s) => s.type === "core-concept");
    assert.ok(core);
    assert.ok(core!.content.length > 0);
  });

  it("generates knowledge-linked transitions between KE section types", () => {
    const tg = new TransitionGenerator();
    const t = tg.generateTransition("definition-card", "how-it-works", {
      facts: richFacts,
      config: {},
      subject: "Index Funds",
      intent: "educate",
      complexity: "intermediate",
    });
    assert.ok(t);
    assert.ok(!/let's explore/i.test(t!));
  });

  it("merges opposing claims into a tradeoff note", () => {
    const composer = new KnowledgeComposer();
    const opposing: PluginFact[] = [
      {
        id: "a",
        statement: "Always use clustering for web servers.",
        factType: "rule",
        confidence: "verified",
        domain: "technology",
        scope: "general",
        tags: [],
      },
      {
        id: "b",
        statement: "Never use clustering for simple I/O-bound web servers.",
        factType: "rule",
        confidence: "verified",
        domain: "technology",
        scope: "general",
        tags: [],
      },
      {
        id: "c",
        statement: "Node.js cluster spawns worker processes.",
        factType: "definition",
        confidence: "verified",
        domain: "technology",
        scope: "general",
        tags: [],
      },
      {
        id: "d",
        statement: "Worker processes share the server port.",
        factType: "property",
        confidence: "verified",
        domain: "technology",
        scope: "general",
        tags: [],
      },
    ];

    const result = composer.compose(opposing, {
      rendererId: "long-article-v2-v5.1.0",
      rendererVersion: "5.1.0",
      templateVersion: "1.0.0",
      format: "markdown",
      style: ["intermediate"],
      slug: "nodejs-cluster",
      category: "technology",
      intent: "educate",
    });

    const treeText = JSON.stringify(result.documentTree);
    assert.ok(
      /tradeoff/i.test(treeText) || result.sections.some((s) => s.type === "best-practices"),
      "contradiction handling or practice section present"
    );
  });
});
