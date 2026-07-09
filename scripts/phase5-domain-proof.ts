/**
 * Phase 5 domain proof — multi-source assembly without live DB mutation.
 * Demonstrates BEFORE (single-source) vs AFTER (multi-source Phase 5 extraction).
 */
import { extractFacts } from "../services/knowledge/factExtractor";
import { deduplicateFacts } from "../services/knowledge/factDeduplicator";
import { resolveConflicts } from "../services/knowledge/conflictResolver";
import { calculateConfidence } from "../services/knowledge/confidenceCalculator";
import { buildRelationships } from "../services/knowledge/relationshipBuilder";
import { computeKnowledgePackageMetrics } from "../services/knowledge/knowledgePackageMetrics";
import type { CandidateInput, CitationRecord } from "../services/knowledge/types";
import { writeFileSync, mkdirSync } from "fs";
import { clearGlossaryCache } from "../services/knowledge/normalizer";

const DOMAIN_TOPICS: { domain: string; slug: string; candidates: CandidateInput[] }[] = [
  {
    domain: "technology",
    slug: "nodejs-cluster",
    candidates: [
      {
        id: "tech-1",
        title: "Node.js Cluster Module",
        description:
          "Node.js cluster module spawns worker processes to utilize multi-core systems. Node.js was created by Ryan Dahl. Worker processes share the server port. The cluster module depends on the operating system process model. Warning: avoid clustering for simple I/O-bound workloads.",
        sourceUrl: "https://nodejs.org/api/cluster.html",
        discoveryRunId: "t1",
        adapterName: "DocsAdapter",
        sourceSlug: "nodejs-docs",
        sourceAuthority: "official",
        metadata: { domain: "technology" },
      },
      {
        id: "tech-2",
        title: "Scaling Node.js Applications",
        description:
          "Node.js uses an event loop for concurrency. Cluster module implements load balancing across workers. Node.js cluster replaces single-process CPU bottlenecks. To scale Node.js horizontally, use cluster or worker threads. Node.js supports zero-downtime reload via cluster disconnect.",
        sourceUrl: "https://example.com/nodejs-scale",
        discoveryRunId: "t2",
        adapterName: "CommunityAdapter",
        sourceSlug: "community",
        sourceAuthority: "community",
        metadata: { domain: "technology" },
      },
    ],
  },
  {
    domain: "finance",
    slug: "index-funds",
    candidates: [
      {
        id: "fin-1",
        title: "Index Funds Explained",
        description:
          "An index fund is a mutual fund that passively tracks a market index. Index funds have low expense ratios compared to active funds. Vanguard pioneered consumer index funds. Warning: avoid chasing last year's hottest sector index.",
        sourceUrl: "https://example.com/index",
        discoveryRunId: "f1",
        adapterName: "FinanceAdapter",
        sourceSlug: "investopedia",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "finance" },
      },
      {
        id: "fin-2",
        title: "ETF vs Index Fund",
        description:
          "Index funds price at end-of-day NAV rather than trading continuously. ETFs compete with index funds for passive investors. Prefer funds with expense ratios below industry averages. Index funds require minimum investments at some brokerages.",
        sourceUrl: "https://example.com/etf",
        discoveryRunId: "f2",
        adapterName: "FinanceAdapter",
        sourceSlug: "bogleheads",
        sourceAuthority: "community",
        metadata: { domain: "finance" },
      },
    ],
  },
  {
    domain: "health",
    slug: "vaccination-basics",
    candidates: [
      {
        id: "h1",
        title: "Vaccination Overview",
        description:
          "Vaccination stimulates immunity without causing disease. Vaccines contain weakened or inactivated pathogens. The WHO recommends routine childhood immunization schedules. Vaccination prevents outbreaks through herd immunity. Warning: never skip scheduled doses without medical advice.",
        sourceUrl: "https://example.com/vaccines",
        discoveryRunId: "h1",
        adapterName: "HealthAdapter",
        sourceSlug: "who",
        sourceAuthority: "official",
        metadata: { domain: "health" },
      },
      {
        id: "h2",
        title: "How Vaccines Work",
        description:
          "Vaccines train the immune system to recognize pathogens. Immunity develops over 1-2 weeks after vaccination. Vaccination causes mild side effects in some patients. Booster doses reinforce long-term immunity.",
        sourceUrl: "https://example.com/how-vaccines",
        discoveryRunId: "h2",
        adapterName: "HealthAdapter",
        sourceSlug: "cdc",
        sourceAuthority: "official",
        metadata: { domain: "health" },
      },
    ],
  },
  {
    domain: "travel",
    slug: "travel-planning",
    candidates: [
      {
        id: "tr1",
        title: "Travel Planning Guide",
        description:
          "Travel planning requires budgeting for flights, lodging, and activities. Thailand is a popular destination for budget travelers. Travel insurance covers medical emergencies abroad. Warning: avoid traveling without valid passport and visa documents.",
        sourceUrl: "https://example.com/travel",
        discoveryRunId: "tr1",
        adapterName: "TravelAdapter",
        sourceSlug: "guide",
        sourceAuthority: "encyclopedic",
        metadata: { domain: "travel" },
      },
      {
        id: "tr2",
        title: "International Travel Checklist",
        description:
          "Travel itineraries should include buffer days for delays. Japan requires visitors to carry passport at all times. Travel planning depends on seasonal weather patterns. Book lodging in Tokyo early during cherry blossom season.",
        sourceUrl: "https://example.com/checklist",
        discoveryRunId: "tr2",
        adapterName: "TravelAdapter",
        sourceSlug: "community",
        sourceAuthority: "community",
        metadata: { domain: "travel" },
      },
    ],
  },
  {
    domain: "business",
    slug: "business-strategy",
    candidates: [
      {
        id: "b1",
        title: "Business Strategy Fundamentals",
        description:
          "Business strategy defines how a company competes in its market. Strategy requires understanding customer needs and competitor positioning. Porter's framework analyzes industry competitive forces. Warning: avoid strategy changes without measuring current performance metrics.",
        sourceUrl: "https://example.com/strategy",
        discoveryRunId: "b1",
        adapterName: "BusinessAdapter",
        sourceSlug: "hbr",
        sourceAuthority: "academic",
        metadata: { domain: "business" },
      },
      {
        id: "b2",
        title: "Implementing Business Strategy",
        description:
          "Business strategy depends on organizational capabilities. Implementation requires clear KPIs and accountability. Strategy replaces ad-hoc decision making with structured priorities. Metrics track progress toward strategic goals.",
        sourceUrl: "https://example.com/implement",
        discoveryRunId: "b2",
        adapterName: "BusinessAdapter",
        sourceSlug: "community",
        sourceAuthority: "community",
        metadata: { domain: "business" },
      },
    ],
  },
];

async function runPipeline(candidates: CandidateInput[], sourceWordCount: number) {
  const { facts: extracted, citations } = await extractFacts(candidates);
  const { facts: deduped, duplicatesMerged } = deduplicateFacts(extracted);
  const { facts: resolved, conflicts } = resolveConflicts(deduped, citations);
  const finalFacts = calculateConfidence(resolved, citations);
  const relationships = buildRelationships(finalFacts);
  const metrics = computeKnowledgePackageMetrics({
    facts: finalFacts,
    relationships,
    citations,
    conflicts,
    sourceWordCount,
  });
  return { finalFacts, relationships, citations, conflicts, duplicatesMerged, metrics };
}

async function main() {
  clearGlossaryCache();
  mkdirSync("temp", { recursive: true });

  const results = [];

  for (const topic of DOMAIN_TOPICS) {
    const single = await extractFacts([topic.candidates[0]]);
    const before = await runPipeline([topic.candidates[0]], single.sourceWordCount);
    const multiExtract = await extractFacts(topic.candidates);
    const after = await runPipeline(topic.candidates, multiExtract.sourceWordCount);

    results.push({
      domain: topic.domain,
      slug: topic.slug,
      before: {
        facts: before.metrics.factCount,
        entities: before.metrics.entityCount,
        relationships: before.metrics.relationshipCount,
        citations: before.metrics.citationCount,
        citationCoverage: before.metrics.citationCoverage,
        completenessScore: before.metrics.completenessScore,
        confidenceScore: before.metrics.confidenceScore,
        knowledgeRichness: before.metrics.knowledgeRichness,
        sampleFacts: before.finalFacts.slice(0, 3).map((f) => f.statement),
      },
      after: {
        facts: after.metrics.factCount,
        entities: after.metrics.entityCount,
        relationships: after.metrics.relationshipCount,
        citations: after.metrics.citationCount,
        citationCoverage: after.metrics.citationCoverage,
        multiSourceCoverage: after.metrics.multiSourceCoverage,
        completenessScore: after.metrics.completenessScore,
        confidenceScore: after.metrics.confidenceScore,
        knowledgeRichness: after.metrics.knowledgeRichness,
        duplicatesMerged: after.duplicatesMerged,
        conflictsDetected: after.conflicts.length,
        sampleFacts: after.finalFacts.slice(0, 3).map((f) => f.statement),
      },
      improved: after.metrics.knowledgeRichness > before.metrics.knowledgeRichness,
    });
  }

  writeFileSync("temp/phase5-domain-proof.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main();
