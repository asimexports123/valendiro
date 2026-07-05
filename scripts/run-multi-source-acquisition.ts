/**
 * Knowledge Acquisition Strategy Revision
 * Multi-Source Acquisition
 * 
 * Aggregate information from multiple authoritative sources into one canonical Knowledge Package
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { PythonDocumentationConnector } from "../services/acquisition/connectors/pythonDocumentationConnector";
import { GitDocumentationConnector } from "../services/acquisition/connectors/gitDocumentationConnector";
import { MDNConnector } from "../services/acquisition/connectors/mdnConnector";
import { HTMLDocumentationExtractor } from "../services/acquisition/extractors/htmlDocumentationExtractor";
import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { QualityMetricsCalculator } from "../services/qualityMetrics/qualityMetrics";
import { createHash } from "crypto";

interface SourceConfig {
  name: string;
  url: string;
  connector: any;
  extractor: any;
  priority: number; // Higher priority sources override lower priority for same data
}

interface MultiSourceResult {
  topic: string;
  sources: SourceConfig[];
  knowledgeBefore: any;
  knowledgeAfter: any;
  qualityBefore: number;
  qualityAfter: number;
  coverageBefore: number;
  coverageAfter: number;
  completenessBefore: number;
  completenessAfter: number;
  authorityBefore: number;
  authorityAfter: number;
  freshnessBefore: number;
  freshnessAfter: number;
  validationPassed: boolean;
  qaGatePassed: boolean;
  structuredCollectionsPopulated: string[];
  missingCollections: string[];
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

function mergeKnowledge(knowledgeArrays: any[], priorities: number[]): any {
  const merged = {
    definitions: [],
    concepts: [],
    procedures: [],
    examples: [],
    comparisons: [],
    commands: [],
    formulae: [],
    warnings: [],
    bestPractices: [],
    commonMistakes: [],
    faqs: [],
    references: [],
    metadata: {
      sourceUrl: "",
      extractedAt: new Date().toISOString(),
      confidence: "high",
    },
  };

  // Deduplicate by ID or key, keeping higher priority sources
  const seenIds = new Set<string>();
  const seenTerms = new Set<string>();
  const seenNames = new Set<string>();

  knowledgeArrays.forEach((knowledge, idx) => {
    const priority = priorities[idx];

    // Merge definitions (deduplicate by term)
    knowledge.definitions?.forEach((d: any) => {
      const key = d.term?.toLowerCase() || d.id;
      if (!seenTerms.has(key)) {
        seenTerms.add(key);
        (merged.definitions as any[]).push({ ...d, sourcePriority: priority });
      }
    });

    // Merge concepts (deduplicate by name)
    knowledge.concepts?.forEach((c: any) => {
      const key = c.name?.toLowerCase() || c.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.concepts as any[]).push({ ...c, sourcePriority: priority });
      }
    });

    // Merge procedures (deduplicate by name)
    knowledge.procedures?.forEach((p: any) => {
      const key = p.name?.toLowerCase() || p.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.procedures as any[]).push({ ...p, sourcePriority: priority });
      }
    });

    // Merge examples (deduplicate by title)
    knowledge.examples?.forEach((e: any) => {
      const key = e.title?.toLowerCase() || e.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.examples as any[]).push({ ...e, sourcePriority: priority });
      }
    });

    // Merge warnings (deduplicate by title)
    knowledge.warnings?.forEach((w: any) => {
      const key = w.title?.toLowerCase() || w.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.warnings as any[]).push({ ...w, sourcePriority: priority });
      }
    });

    // Merge best practices (deduplicate by title)
    knowledge.bestPractices?.forEach((bp: any) => {
      const key = bp.title?.toLowerCase() || bp.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.bestPractices as any[]).push({ ...bp, sourcePriority: priority });
      }
    });

    // Merge references (deduplicate by URL)
    const seenUrls = new Set<string>();
    knowledge.references?.forEach((r: any) => {
      const key = r.url?.toLowerCase() || r.id;
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        (merged.references as any[]).push({ ...r, sourcePriority: priority });
      }
    });
  });

  return merged;
}

async function runMultiSourceAcquisition() {
  const timestamp = new Date().toISOString();
  console.log("Multi-Source Acquisition Strategy");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  // Define multi-source configurations for each topic
  const pilotTopics = [
    {
      name: "Python Programming Fundamentals",
      sources: [
        {
          name: "Python Official Documentation - Tutorial",
          url: "https://docs.python.org/3/tutorial/introduction.html",
          connector: new PythonDocumentationConnector(),
          extractor,
          priority: 1,
        },
        {
          name: "Python Official Documentation - Language Reference",
          url: "https://docs.python.org/3/reference/index.html",
          connector: new PythonDocumentationConnector(),
          extractor,
          priority: 2,
        },
      ],
    },
    {
      name: "Git Version Control",
      sources: [
        {
          name: "Git Book - Branching",
          url: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows",
          connector: new GitDocumentationConnector(),
          extractor,
          priority: 1,
        },
        {
          name: "Git Documentation - Reference",
          url: "https://git-scm.com/docs",
          connector: new GitDocumentationConnector(),
          extractor,
          priority: 2,
        },
      ],
    },
    {
      name: "JavaScript Fundamentals",
      sources: [
        {
          name: "MDN - JavaScript Closures",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
          connector: new MDNConnector(),
          extractor,
          priority: 1,
        },
        {
          name: "MDN - JavaScript Guide",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
          connector: new MDNConnector(),
          extractor,
          priority: 2,
        },
      ],
    },
  ];

  const results: MultiSourceResult[] = [];

  for (const topic of pilotTopics) {
    console.log(`Processing: ${topic.name}`);
    console.log(`Sources: ${topic.sources.length}`);
    console.log("-".repeat(40));

    const result: MultiSourceResult = {
      topic: topic.name,
      sources: topic.sources,
      knowledgeBefore: null,
      knowledgeAfter: null,
      qualityBefore: 0,
      qualityAfter: 0,
      coverageBefore: 0,
      coverageAfter: 0,
      completenessBefore: 0,
      completenessAfter: 0,
      authorityBefore: 0,
      authorityAfter: 0,
      freshnessBefore: 0,
      freshnessAfter: 0,
      validationPassed: false,
      qaGatePassed: false,
      structuredCollectionsPopulated: [],
      missingCollections: [],
    };

    try {
      // Step 1: Acquire from first source (baseline - single source)
      const firstSource = topic.sources[0];
      const firstConnectorResult = await firstSource.connector.connect({
        sourceType: firstSource.connector.sourceType as any,
        sourceUrl: firstSource.url,
      });

      if (!firstConnectorResult.data) {
        console.log(`  ❌ First source failed: ${firstConnectorResult.error}`);
        continue;
      }

      const firstExtractorResult = await firstSource.extractor.extract(firstConnectorResult.data, {
        sourceUrl: firstSource.url,
      } as any);

      if (!firstExtractorResult.success || !firstExtractorResult.knowledge) {
        console.log(`  ❌ First source extraction failed: ${firstExtractorResult.error}`);
        continue;
      }

      result.knowledgeBefore = firstExtractorResult.knowledge;

      // Create baseline package
      const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const slug = topic.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const createPackage = (knowledge: any) => {
        const uniqueConcepts = knowledge.concepts.filter((concept: any, index: number, self: any[]) => 
          index === self.findIndex((c: any) => c.name === concept.name)
        );

        return {
          id: knowledgePackageId,
          slug,
          knowledgeHash: generateKnowledgeHash(knowledge),
          topicId: null,
          category: "technology",
          intent: "educate" as const,
          definitions: knowledge.definitions.map((d: any) => ({
            id: d.id,
            term: d.term,
            definition: d.definition,
            confidence: "high",
          })),
          concepts: uniqueConcepts.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            confidence: "high",
          })),
          procedures: knowledge.procedures.map((p: any) => ({
            id: p.id,
            name: p.name,
            steps: p.steps,
            confidence: "high",
          })),
          examples: knowledge.examples.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            code: e.code,
            confidence: "high",
          })),
          comparisons: [],
          commands: [],
          formulae: [],
          warnings: knowledge.warnings.map((w: any) => ({
            id: w.id,
            title: w.title,
            description: w.description,
            severity: w.severity,
            confidence: "high",
          })),
          bestPractices: knowledge.bestPractices.map((bp: any) => ({
            id: bp.id,
            title: bp.title,
            description: bp.description,
            confidence: "high",
          })),
          commonMistakes: [],
          faqs: [],
          references: knowledge.references.map((r: any) => ({
            id: r.id,
            url: r.url,
            title: r.title,
          })),
          facts: [],
          citations: [],
          relationships: [],
          metadata: {
            sourceCount: 1,
            factCount: 0,
            relationshipCount: 0,
            lastUpdated: new Date().toISOString(),
            lastVerified: null,
            confidence: "high",
            sourceMetadata: {
              adapterName: firstSource.connector.sourceType,
              adapterVersion: firstSource.connector.version,
              sourceType: firstSource.connector.sourceType as any,
              retrievedAt: firstConnectorResult.metadata.retrievedAt,
              processedAt: new Date().toISOString(),
              validationStatus: "valid" as const,
            },
          },
        };
      };

      const baselinePackage = createPackage(result.knowledgeBefore);
      const baselineValidation = dataProcessor.processPackage(baselinePackage, []);
      const baselineMetrics = qualityMetricsCalculator.calculateMetrics(baselinePackage);

      result.qualityBefore = baselineMetrics.overallQualityScore;
      result.coverageBefore = baselineMetrics.coverageScore;
      result.completenessBefore = baselineMetrics.completenessScore;
      result.authorityBefore = baselineMetrics.authorityScore;
      result.freshnessBefore = baselineMetrics.freshnessScore;

      console.log(`  Baseline Quality: ${result.qualityBefore}/100`);
      console.log(`  Baseline Coverage: ${result.coverageBefore}/100`);

      // Step 2: Acquire from all sources
      console.log(`  Acquiring from ${topic.sources.length} sources...`);
      const knowledgeArrays: any[] = [];
      const priorities: number[] = [];

      for (const source of topic.sources) {
        console.log(`    - ${source.name}`);
        const connectorResult = await source.connector.connect({
          sourceType: source.connector.sourceType as any,
          sourceUrl: source.url,
        });

        if (connectorResult.data) {
          const extractorResult = await source.extractor.extract(connectorResult.data, {
            sourceUrl: source.url,
          } as any);

          if (extractorResult.success && extractorResult.knowledge) {
            knowledgeArrays.push(extractorResult.knowledge);
            priorities.push(source.priority);
          }
        }
      }

      // Step 3: Merge knowledge from all sources
      result.knowledgeAfter = mergeKnowledge(knowledgeArrays, priorities);

      console.log(`  Merged ${knowledgeArrays.length} sources`);

      // Create merged package
      const mergedPackage = createPackage(result.knowledgeAfter);
      mergedPackage.metadata.sourceCount = topic.sources.length;

      const mergedValidation = dataProcessor.processPackage(mergedPackage, []);
      const mergedMetrics = qualityMetricsCalculator.calculateMetrics(mergedPackage);

      result.qualityAfter = mergedMetrics.overallQualityScore;
      result.coverageAfter = mergedMetrics.coverageScore;
      result.completenessAfter = mergedMetrics.completenessScore;
      result.authorityAfter = mergedMetrics.authorityScore;
      result.freshnessAfter = mergedMetrics.freshnessScore;
      result.validationPassed = mergedValidation.valid;

      console.log(`  Merged Quality: ${result.qualityAfter}/100`);
      console.log(`  Merged Coverage: ${result.coverageAfter}/100`);
      console.log(`  Quality Improvement: +${(result.qualityAfter - result.qualityBefore).toFixed(1)}`);
      console.log(`  Coverage Improvement: +${(result.coverageAfter - result.coverageBefore).toFixed(1)}`);

      // QA Gate checks
      const missingCollections: string[] = [];
      if (result.knowledgeAfter.definitions.length === 0) missingCollections.push("definitions");
      if (result.knowledgeAfter.concepts.length === 0) missingCollections.push("concepts");
      if (result.knowledgeAfter.procedures.length === 0) missingCollections.push("procedures");
      if (result.knowledgeAfter.examples.length === 0) missingCollections.push("examples");

      result.missingCollections = missingCollections;

      if (result.knowledgeAfter.definitions.length > 0) result.structuredCollectionsPopulated.push("definitions");
      if (result.knowledgeAfter.concepts.length > 0) result.structuredCollectionsPopulated.push("concepts");
      if (result.knowledgeAfter.procedures.length > 0) result.structuredCollectionsPopulated.push("procedures");
      if (result.knowledgeAfter.examples.length > 0) result.structuredCollectionsPopulated.push("examples");

      const qaGateChecks = [
        result.validationPassed,
        result.coverageAfter >= 50,
        result.completenessAfter >= 50,
        result.authorityAfter >= 50,
        result.freshnessAfter >= 50,
        missingCollections.length === 0,
        result.knowledgeAfter.references.length > 0,
        result.structuredCollectionsPopulated.length >= 2,
      ];

      result.qaGatePassed = qaGateChecks.every(check => check === true);

      console.log(`  QA Gate: ${result.qaGatePassed ? "✅ PASSED" : "❌ FAILED"}`);
      console.log(`  Structured Collections: ${result.structuredCollectionsPopulated.join(", ")}`);
      console.log(`  Missing Collections: ${missingCollections.join(", ") || "None"}`);

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`);
    }

    results.push(result);
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("MULTI-SOURCE ACQUISITION RESULTS");
  console.log("=".repeat(60));

  results.forEach(r => {
    console.log(`\n${r.topic}:`);
    console.log(`  Sources: ${r.sources.length}`);
    console.log(`  Quality: ${r.qualityBefore} → ${r.qualityAfter} (+${(r.qualityAfter - r.qualityBefore).toFixed(1)})`);
    console.log(`  Coverage: ${r.coverageBefore} → ${r.coverageAfter} (+${(r.coverageAfter - r.coverageBefore).toFixed(1)})`);
    console.log(`  QA Gate: ${r.qaGatePassed ? "✅ PASSED" : "❌ FAILED"}`);
  });

  return results;
}

runMultiSourceAcquisition()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Multi-source acquisition failed:", error);
    process.exit(1);
  });
