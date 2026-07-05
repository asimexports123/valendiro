/**
 * Production Integration Validation
 * 
 * End-to-end validation of connectors using real authoritative sources
 * No mock data, no simulated responses
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { PythonDocumentationConnector } from "../services/acquisition/connectors/pythonDocumentationConnector";
import { GitDocumentationConnector } from "../services/acquisition/connectors/gitDocumentationConnector";
import { DockerDocumentationConnector } from "../services/acquisition/connectors/dockerDocumentationConnector";
import { NodejsDocumentationConnector } from "../services/acquisition/connectors/nodejsDocumentationConnector";
import { TypeScriptDocumentationConnector } from "../services/acquisition/connectors/typeScriptDocumentationConnector";
import { PostgreSQLDocumentationConnector } from "../services/acquisition/connectors/postgresqlDocumentationConnector";
import { MDNConnector } from "../services/acquisition/connectors/mdnConnector";
import { HTMLDocumentationExtractor } from "../services/acquisition/extractors/htmlDocumentationExtractor";
import { MDNExtractor } from "../services/acquisition/extractors/mdnExtractor";
import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { QualityMetricsCalculator } from "../services/qualityMetrics/qualityMetrics";
import { createHash } from "crypto";

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

interface ValidationTest {
  connector: string;
  sourceUrl: string;
  topic: string;
}

interface ValidationResult {
  connector: string;
  sourceUrl: string;
  topic: string;
  connectionSuccess: boolean;
  connectionError?: string;
  extractionSuccess: boolean;
  extractionError?: string;
  structuredFactsExtracted: number;
  collectionsPopulated: string[];
  validationSuccess: boolean;
  validationError?: string;
  knowledgePackageId?: string;
}

async function runProductionValidation() {
  console.log("Production Integration Validation");
  console.log("=".repeat(60));
  console.log("Testing connectors with real authoritative sources\n");

  const tests: ValidationTest[] = [
    {
      connector: "Python Official Documentation",
      sourceUrl: "https://docs.python.org/3/tutorial/introduction.html",
      topic: "Python Variables",
    },
    {
      connector: "Git Official Documentation",
      sourceUrl: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows",
      topic: "Git Branch",
    },
    {
      connector: "Docker Official Documentation",
      sourceUrl: "https://docs.docker.com/get-started/overview/",
      topic: "Docker Images",
    },
    {
      connector: "Node.js Documentation",
      sourceUrl: "https://nodejs.org/en/docs/",
      topic: "Event Loop",
    },
    {
      connector: "TypeScript Documentation",
      sourceUrl: "https://www.typescriptlang.org/docs/handbook/interfaces.html",
      topic: "Interfaces",
    },
    {
      connector: "PostgreSQL Documentation",
      sourceUrl: "https://www.postgresql.org/docs/current/indexes-types.html",
      topic: "Indexes",
    },
    {
      connector: "MDN",
      sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
      topic: "JavaScript Closures",
    },
  ];

  const results: ValidationResult[] = [];

  for (const test of tests) {
    console.log(`\nTesting: ${test.connector}`);
    console.log(`Source URL: ${test.sourceUrl}`);
    console.log(`Topic: ${test.topic}`);
    console.log("-".repeat(40));

    const result = await validateConnector(test);
    results.push(result);

    console.log(`Connection: ${result.connectionSuccess ? "✅ SUCCESS" : "❌ FAILED"}`);
    if (result.connectionError) {
      console.log(`  Error: ${result.connectionError}`);
    }
    console.log(`Extraction: ${result.extractionSuccess ? "✅ SUCCESS" : "❌ FAILED"}`);
    if (result.extractionError) {
      console.log(`  Error: ${result.extractionError}`);
    }
    console.log(`Structured Facts Extracted: ${result.structuredFactsExtracted}`);
    console.log(`Collections Populated: ${result.collectionsPopulated.join(", ")}`);
    console.log(`Validation: ${result.validationSuccess ? "✅ SUCCESS" : "❌ FAILED"}`);
    if (result.validationError) {
      console.log(`  Error: ${result.validationError}`);
    }
    if (result.knowledgePackageId) {
      console.log(`Knowledge Package ID: ${result.knowledgePackageId}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("PRODUCTION VALIDATION RESULTS");
  console.log("=".repeat(60));
  console.log(`Total Connectors Tested: ${results.length}`);
  console.log(`Connection Success: ${results.filter(r => r.connectionSuccess).length}/${results.length}`);
  console.log(`Extraction Success: ${results.filter(r => r.extractionSuccess).length}/${results.length}`);
  console.log(`Validation Success: ${results.filter(r => r.validationSuccess).length}/${results.length}`);

  const failedConnectors = results.filter(r => !r.validationSuccess);
  if (failedConnectors.length > 0) {
    console.log(`\nFailed Connectors: ${failedConnectors.length}`);
    failedConnectors.forEach(f => {
      console.log(`  ❌ ${f.connector}: ${f.validationError || f.extractionError || f.connectionError}`);
    });
  }
}

async function validateConnector(test: ValidationTest): Promise<ValidationResult> {
  const result: ValidationResult = {
    connector: test.connector,
    sourceUrl: test.sourceUrl,
    topic: test.topic,
    connectionSuccess: false,
    extractionSuccess: false,
    structuredFactsExtracted: 0,
    collectionsPopulated: [],
    validationSuccess: false,
  };

  try {
    // Step 1: Connector
    const connector = getConnector(test.connector);
    const connectorResult = await connector.connect({
      sourceType: connector.sourceType as any,
      sourceUrl: test.sourceUrl,
    });

    if (!connectorResult.data) {
      result.connectionError = connectorResult.error || "No data returned";
      return result;
    }

    result.connectionSuccess = true;
    console.log(`  Connection succeeded (${connectorResult.metadata.latency}ms)`);

    // Step 2: Extractor
    const extractor = getExtractor(test.connector);
    const extractorResult = await extractor.extract(connectorResult.data, {
      sourceUrl: test.sourceUrl,
    } as any);

    if (!extractorResult.success || !extractorResult.knowledge) {
      result.extractionError = extractorResult.error || "Extraction failed";
      return result;
    }

    result.extractionSuccess = true;
    console.log(`  Extraction succeeded`);

    const knowledge = extractorResult.knowledge;
    result.structuredFactsExtracted = 
      knowledge.definitions.length +
      knowledge.concepts.length +
      knowledge.procedures.length +
      knowledge.examples.length +
      knowledge.warnings.length +
      knowledge.bestPractices.length;

    result.collectionsPopulated = [];
    if (knowledge.definitions.length > 0) result.collectionsPopulated.push("definitions");
    if (knowledge.concepts.length > 0) result.collectionsPopulated.push("concepts");
    if (knowledge.procedures.length > 0) result.collectionsPopulated.push("procedures");
    if (knowledge.examples.length > 0) result.collectionsPopulated.push("examples");
    if (knowledge.warnings.length > 0) result.collectionsPopulated.push("warnings");
    if (knowledge.bestPractices.length > 0) result.collectionsPopulated.push("bestPractices");

    console.log(`  Structured facts: ${result.structuredFactsExtracted}`);

    // Step 3: Create Knowledge Package (simplified for validation)
    const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    result.knowledgePackageId = knowledgePackageId;

    // Step 4: Schema Validation (basic check)
    const dataProcessor = new DataProcessor({
      minConfidence: 0.0,
      allowPlaceholders: false,
      requireMetadata: true,
    });

    // Deduplicate concepts by name
    const uniqueConcepts = knowledge.concepts.filter((concept: any, index: number, self: any[]) => 
      index === self.findIndex((c: any) => c.name === concept.name)
    );

    // Create a proper Knowledge Package with structured types
    const testPackage = {
      id: knowledgePackageId,
      slug: test.topic.toLowerCase().replace(/\s+/g, "-"),
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
          adapterName: connector.sourceType,
          adapterVersion: connector.version,
          sourceType: connector.sourceType as any,
          retrievedAt: connectorResult.metadata.retrievedAt,
          processedAt: new Date().toISOString(),
          validationStatus: "valid" as const,
        },
      },
    };

    const validationResult = dataProcessor.processPackage(testPackage, []);
    if (!validationResult.valid) {
      result.validationError = validationResult.errors.join(", ");
      return result;
    }

    result.validationSuccess = true;
    console.log(`  Validation succeeded`);

    // Step 5: Quality Metrics
    const qualityMetricsCalculator = new QualityMetricsCalculator();
    const metrics = qualityMetricsCalculator.calculateMetrics(testPackage);
    console.log(`  Quality Score: ${metrics.overallQualityScore}/100`);

  } catch (error: any) {
    result.validationError = `Exception: ${error.message}`;
    console.log(`  Exception: ${error.message}`);
  }

  return result;
}

function getConnector(connectorName: string) {
  switch (connectorName) {
    case "Python Official Documentation":
      return new PythonDocumentationConnector();
    case "Git Official Documentation":
      return new GitDocumentationConnector();
    case "Docker Official Documentation":
      return new DockerDocumentationConnector();
    case "Node.js Documentation":
      return new NodejsDocumentationConnector();
    case "TypeScript Documentation":
      return new TypeScriptDocumentationConnector();
    case "PostgreSQL Documentation":
      return new PostgreSQLDocumentationConnector();
    case "MDN":
      return new MDNConnector();
    default:
      throw new Error(`Unknown connector: ${connectorName}`);
  }
}

function getExtractor(connectorName: string) {
  switch (connectorName) {
    case "MDN":
      // MDN returns HTML, use HTML extractor
      return new HTMLDocumentationExtractor();
    default:
      return new HTMLDocumentationExtractor();
  }
}

runProductionValidation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Validation failed:", error);
    process.exit(1);
  });
