/**
 * Golden tests — Phase 5 Knowledge Acquisition & Synthesis Excellence
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyFactType,
  decomposeIntoAtomicClaims,
  extractListItems,
  extractFacts,
  splitIntoSentences,
} from "../../services/knowledge/factExtractor";
import { buildRelationships } from "../../services/knowledge/relationshipBuilder";
import { deduplicateFacts } from "../../services/knowledge/factDeduplicator";
import { extractEntitiesFromText } from "../../services/knowledge/entityExtractor";
import { computeKnowledgePackageMetrics } from "../../services/knowledge/knowledgePackageMetrics";
import type { CandidateInput } from "../../services/knowledge/types";

const TECH_CANDIDATES: CandidateInput[] = [
  {
    id: "src-1",
    title: "Node.js Cluster Module",
    description:
      "Node.js cluster module spawns worker processes. Node.js cluster depends on the built-in cluster module. Worker processes share the server port. Warning: never use clustering for simple I/O-bound web servers. Node.js was created by Ryan Dahl. Clustering requires understanding of process management.",
    sourceUrl: "https://nodejs.org/api/cluster.html",
    discoveryRunId: "run-1",
    adapterName: "DocsAdapter",
    sourceSlug: "nodejs-docs",
    sourceAuthority: "official",
    metadata: { domain: "technology" },
  },
  {
    id: "src-2",
    title: "Node.js Scaling Guide",
    description:
      "Node.js uses an event loop for concurrency. Cluster module implements load balancing across workers. Node.js cluster replaces single-process bottlenecks on multi-core systems. To scale Node.js, use cluster or worker threads. Node.js supports horizontal scaling via clustering.",
    sourceUrl: "https://example.com/nodejs-scaling",
    discoveryRunId: "run-2",
    adapterName: "CommunityAdapter",
    sourceSlug: "community",
    sourceAuthority: "community",
    metadata: { domain: "technology" },
  },
];

const FINANCE_CANDIDATES: CandidateInput[] = [
  {
    id: "fin-1",
    title: "Index Funds Overview",
    description:
      "An index fund is a mutual fund that passively tracks a market index. Index funds have low expense ratios. Vanguard pioneered low-cost index funds. Warning: avoid chasing last year's hottest sector index.",
    sourceUrl: "https://example.com/index-funds",
    discoveryRunId: "fin-run-1",
    adapterName: "FinanceAdapter",
    sourceSlug: "investopedia",
    sourceAuthority: "encyclopedic",
    metadata: { domain: "finance" },
  },
  {
    id: "fin-2",
    title: "ETF vs Index Fund",
    description:
      "Index funds price at end-of-day NAV rather than trading continuously. ETFs compete with index funds for passive investors. Index funds require a minimum investment at some brokerages. Prefer funds with expense ratios below industry averages.",
    sourceUrl: "https://example.com/etf-index",
    discoveryRunId: "fin-run-2",
    adapterName: "FinanceAdapter",
    sourceSlug: "bogleheads",
    sourceAuthority: "community",
    metadata: { domain: "finance" },
  },
];

describe("Phase 5 knowledge acquisition excellence", () => {
  it("extracts list items and compound claims", () => {
    const decomp = decomposeIntoAtomicClaims("Python supports OOP, procedural, and functional programming");
    assert.ok(decomp.length >= 3);

    const items = extractListItems("- Use low-cost funds\n- Reinvest dividends\n- Avoid market timing");
    assert.equal(items.length, 3);
  });

  it("identifies entities with types", () => {
    const entities = extractEntitiesFromText(
      "JavaScript was created by Brendan Eich at Mozilla. React is a framework built on JavaScript."
    );
    assert.ok(entities.some((e) => e.type === "language" || e.type === "framework"));
    assert.ok(entities.length >= 2);
  });

  it("extracts richer facts from multi-source candidates", async () => {
    const single = await extractFacts([TECH_CANDIDATES[0]]);
    const multi = await extractFacts(TECH_CANDIDATES);

    assert.ok(multi.facts.length >= single.facts.length, "multi-source should yield >= facts");
    assert.ok(multi.citations.length === 2);
    assert.ok(multi.entityCount >= single.entityCount);
  });

  it("merges duplicate facts preserving provenance", async () => {
    const { facts: extracted } = await extractFacts(TECH_CANDIDATES);
    const { facts: deduped, duplicatesMerged } = deduplicateFacts(extracted);

    assert.ok(deduped.length <= extracted.length);
    const multiProv = deduped.filter((f) => f.provenances.length >= 2);
    if (duplicatesMerged > 0) {
      assert.ok(multiProv.length > 0, "merged facts retain multiple provenances");
    }
  });

  it("builds relationship types from patterns", async () => {
    const { facts: extracted } = await extractFacts(TECH_CANDIDATES);
    const { facts: deduped } = deduplicateFacts(extracted);
    const relationships = buildRelationships(
      deduped.map((f) => ({ ...f, confidence: "medium" as const }))
    );

    const types = new Set(relationships.map((r) => r.type));
    assert.ok(relationships.length > 0);
    assert.ok(
      types.has("depends_on") ||
        types.has("requires") ||
        types.has("related_to") ||
        types.has("replaces") ||
        types.has("precedes")
    );
  });

  it("computes Phase 5 quality metrics", async () => {
    const { facts: extracted, citations } = await extractFacts(FINANCE_CANDIDATES);
    const { facts: deduped } = deduplicateFacts(extracted);
    const relationships = buildRelationships(
      deduped.map((f) => ({ ...f, confidence: "high" as const }))
    );

    const metrics = computeKnowledgePackageMetrics({
      facts: deduped.map((f) => ({ ...f, confidence: "high" as const })),
      relationships,
      citations,
      conflicts: [],
    });

    assert.ok(metrics.factCount > 0);
    assert.ok(metrics.citationCoverage === 100);
    assert.ok(metrics.completenessScore > 0);
    assert.ok(metrics.knowledgeRichness > 0);
    assert.ok(metrics.entityCount > 0);
  });

  it("classifies expanded fact types", () => {
    assert.equal(classifyFactType("Index funds compete with active funds"), "comparison");
    assert.equal(classifyFactType("Node.js depends on the V8 engine"), "property");
    assert.equal(classifyFactType("Avoid chasing hot sectors"), "warning");
  });

  it("splits sentences from structured text", () => {
    const sentences = splitIntoSentences(
      "First sentence here. Second sentence follows; third uses semicolon. Fourth is final."
    );
    assert.ok(sentences.length >= 3);
  });
});
