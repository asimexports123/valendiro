/**
 * Phase 5 - Controlled Publication & Quality Gate
 * 
 * Validate complete production workflow on 3 pilot topics:
 * - Python Programming Fundamentals
 * - Git Version Control
 * - JavaScript Fundamentals
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

interface PilotTopic {
  name: string;
  sourceUrl: string;
  connector: any;
  extractor: any;
}

interface QAReport {
  topic: string;
  sourceUrl: string;
  structuredCollectionsPopulated: string[];
  qualityScore: number;
  coverageScore: number;
  completenessScore: number;
  authorityScore: number;
  freshnessScore: number;
  missingCollections: string[];
  referencesCount: number;
  validationPassed: boolean;
  qaGatePassed: boolean;
  knowledgePackageId?: string;
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

async function runPhase5PilotPublication() {
  const timestamp = new Date().toISOString();
  console.log("Phase 5 - Controlled Publication & Quality Gate");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const pilotTopics: PilotTopic[] = [
    {
      name: "Python Programming Fundamentals",
      sourceUrl: "https://docs.python.org/3/tutorial/introduction.html",
      connector: new PythonDocumentationConnector(),
      extractor: new HTMLDocumentationExtractor(),
    },
    {
      name: "Git Version Control",
      sourceUrl: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows",
      connector: new GitDocumentationConnector(),
      extractor: new HTMLDocumentationExtractor(),
    },
    {
      name: "JavaScript Fundamentals",
      sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
      connector: new MDNConnector(),
      extractor: new HTMLDocumentationExtractor(),
    },
  ];

  const qaReports: QAReport[] = [];
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  for (const topic of pilotTopics) {
    console.log(`Processing: ${topic.name}`);
    console.log(`Source URL: ${topic.sourceUrl}`);
    console.log("-".repeat(40));

    const qaReport: QAReport = {
      topic: topic.name,
      sourceUrl: topic.sourceUrl,
      structuredCollectionsPopulated: [],
      qualityScore: 0,
      coverageScore: 0,
      completenessScore: 0,
      authorityScore: 0,
      freshnessScore: 0,
      missingCollections: [],
      referencesCount: 0,
      validationPassed: false,
      qaGatePassed: false,
    };

    try {
      // Step 1: Connector
      const connectorResult = await topic.connector.connect({
        sourceType: topic.connector.sourceType as any,
        sourceUrl: topic.sourceUrl,
      });

      if (!connectorResult.data) {
        console.log(`  ❌ Connector failed: ${connectorResult.error}`);
        qaReports.push(qaReport);
        continue;
      }

      console.log(`  ✅ Connector succeeded (${connectorResult.metadata.latency}ms)`);

      // Step 2: Extractor
      const extractorResult = await topic.extractor.extract(connectorResult.data, {
        sourceUrl: topic.sourceUrl,
      } as any);

      if (!extractorResult.success || !extractorResult.knowledge) {
        console.log(`  ❌ Extractor failed: ${extractorResult.error}`);
        qaReports.push(qaReport);
        continue;
      }

      console.log(`  ✅ Extractor succeeded`);

      const knowledge = extractorResult.knowledge;

      // Step 3: Create Knowledge Package
      const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      qaReport.knowledgePackageId = knowledgePackageId;

      const uniqueConcepts = knowledge.concepts.filter((concept: any, index: number, self: any[]) => 
        index === self.findIndex((c: any) => c.name === concept.name)
      );

      const slug = topic.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const testPackage = {
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
            adapterName: topic.connector.sourceType,
            adapterVersion: topic.connector.version,
            sourceType: topic.connector.sourceType as any,
            retrievedAt: connectorResult.metadata.retrievedAt,
            processedAt: new Date().toISOString(),
            validationStatus: "valid" as const,
          },
        },
      };

      console.log(`  ✅ Knowledge Package created`);

      // Step 4: Validation
      const validationResult = dataProcessor.processPackage(testPackage, []);
      qaReport.validationPassed = validationResult.valid;

      if (!validationResult.valid) {
        console.log(`  ❌ Validation failed: ${validationResult.errors.join(", ")}`);
        qaReports.push(qaReport);
        continue;
      }

      console.log(`  ✅ Validation succeeded`);

      // Step 5: Quality Metrics
      const qualityMetrics = qualityMetricsCalculator.calculateMetrics(testPackage);
      qaReport.qualityScore = qualityMetrics.overallQualityScore;
      qaReport.coverageScore = qualityMetrics.coverageScore;
      qaReport.completenessScore = qualityMetrics.completenessScore;
      qaReport.authorityScore = qualityMetrics.authorityScore;
      qaReport.freshnessScore = qualityMetrics.freshnessScore;

      console.log(`  Quality Score: ${qaReport.qualityScore}/100`);
      console.log(`  Coverage Score: ${qaReport.coverageScore}/100`);

      // Step 6: Content QA Gate
      const requiredCollections = ["definitions", "concepts"];
      const missingCollections: string[] = [];
      
      if (knowledge.definitions.length === 0) missingCollections.push("definitions");
      if (knowledge.concepts.length === 0) missingCollections.push("concepts");
      if (knowledge.procedures.length === 0) missingCollections.push("procedures");
      if (knowledge.examples.length === 0) missingCollections.push("examples");

      qaReport.missingCollections = missingCollections;
      qaReport.referencesCount = knowledge.references.length;

      // Check which collections are populated
      if (knowledge.definitions.length > 0) qaReport.structuredCollectionsPopulated.push("definitions");
      if (knowledge.concepts.length > 0) qaReport.structuredCollectionsPopulated.push("concepts");
      if (knowledge.procedures.length > 0) qaReport.structuredCollectionsPopulated.push("procedures");
      if (knowledge.examples.length > 0) qaReport.structuredCollectionsPopulated.push("examples");
      if (knowledge.warnings.length > 0) qaReport.structuredCollectionsPopulated.push("warnings");
      if (knowledge.bestPractices.length > 0) qaReport.structuredCollectionsPopulated.push("bestPractices");

      // QA Gate checks
      const qaGateChecks = [
        qaReport.validationPassed,
        qaReport.coverageScore >= 50, // Target threshold
        qaReport.completenessScore >= 50,
        qaReport.authorityScore >= 50,
        qaReport.freshnessScore >= 50,
        missingCollections.length === 0,
        qaReport.referencesCount > 0,
        qaReport.structuredCollectionsPopulated.length >= 2,
      ];

      qaReport.qaGatePassed = qaGateChecks.every(check => check === true);

      console.log(`  QA Gate: ${qaReport.qaGatePassed ? "✅ PASSED" : "❌ FAILED"}`);
      console.log(`  Structured Collections: ${qaReport.structuredCollectionsPopulated.join(", ")}`);
      console.log(`  Missing Collections: ${missingCollections.join(", ") || "None"}`);
      console.log(`  References: ${qaReport.referencesCount}`);

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`);
    }

    qaReports.push(qaReport);
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("PILOT PUBLICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Topics: ${pilotTopics.length}`);

  const passedQA = qaReports.filter(r => r.qaGatePassed).length;
  const failedQA = qaReports.filter(r => !r.qaGatePassed).length;

  console.log(`Passed QA Gate: ${passedQA}`);
  console.log(`Failed QA Gate: ${failedQA}`);

  if (failedQA > 0) {
    console.log(`\nFailed Topics:`);
    qaReports.filter(r => !r.qaGatePassed).forEach(r => {
      console.log(`  ❌ ${r.topic}`);
      console.log(`     Quality Score: ${r.qualityScore}/100`);
      console.log(`     Coverage Score: ${r.coverageScore}/100`);
      console.log(`     Missing Collections: ${r.missingCollections.join(", ") || "None"}`);
    });
  }

  return qaReports;
}

runPhase5PilotPublication()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Pilot publication failed:", error);
    process.exit(1);
  });
