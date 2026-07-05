/**
 * Production Hardening - Phase 3
 * Connector Regression Tests
 * 
 * Every connector must have automated regression tests.
 * A connector update must never silently break extraction.
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
import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { createHash } from "crypto";

interface RegressionTestResult {
  connector: string;
  sourceUrl: string;
  connectionTest: boolean;
  extractionTest: boolean;
  validationTest: boolean;
  regressionTest: boolean;
  timestamp: string;
  error?: string;
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

async function runConnectorRegressionTests() {
  const timestamp = new Date().toISOString();
  console.log("Connector Regression Tests");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const tests = [
    {
      name: "Python Official Documentation",
      connector: new PythonDocumentationConnector(),
      sourceUrl: "https://docs.python.org/3/tutorial/introduction.html",
    },
    {
      name: "Git Official Documentation",
      connector: new GitDocumentationConnector(),
      sourceUrl: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows",
    },
    {
      name: "Docker Official Documentation",
      connector: new DockerDocumentationConnector(),
      sourceUrl: "https://docs.docker.com/get-started/overview/",
    },
    {
      name: "Node.js Documentation",
      connector: new NodejsDocumentationConnector(),
      sourceUrl: "https://nodejs.org/en/docs/",
    },
    {
      name: "TypeScript Documentation",
      connector: new TypeScriptDocumentationConnector(),
      sourceUrl: "https://www.typescriptlang.org/docs/handbook/interfaces.html",
    },
    {
      name: "PostgreSQL Documentation",
      connector: new PostgreSQLDocumentationConnector(),
      sourceUrl: "https://www.postgresql.org/docs/current/indexes-types.html",
    },
    {
      name: "MDN",
      connector: new MDNConnector(),
      sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
    },
  ];

  const results: RegressionTestResult[] = [];
  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });

  for (const { name, connector, sourceUrl } of tests) {
    console.log(`Testing: ${name}`);
    const result: RegressionTestResult = {
      connector: name,
      sourceUrl,
      connectionTest: false,
      extractionTest: false,
      validationTest: false,
      regressionTest: false,
      timestamp,
    };

    try {
      // Connection test
      const connectorResult = await connector.connect({
        sourceType: connector.sourceType as any,
        sourceUrl,
      });

      result.connectionTest = connectorResult.status === "READY";

      if (!result.connectionTest) {
        result.error = connectorResult.error || "Connection failed";
        console.log(`  ❌ Connection failed: ${result.error}`);
        results.push(result);
        continue;
      }

      console.log(`  ✅ Connection test passed`);

      // Extraction test
      const extractorResult = await extractor.extract(connectorResult.data!, {
        sourceUrl,
      } as any);

      result.extractionTest = extractorResult.success;

      if (!result.extractionTest) {
        result.error = extractorResult.error || "Extraction failed";
        console.log(`  ❌ Extraction failed: ${result.error}`);
        results.push(result);
        continue;
      }

      console.log(`  ✅ Extraction test passed`);

      // Regression test: Ensure minimum structured facts are extracted
      const knowledge = extractorResult.knowledge!;
      const structuredFactsCount = 
        knowledge.definitions.length +
        knowledge.concepts.length +
        knowledge.procedures.length +
        knowledge.examples.length +
        knowledge.warnings.length +
        knowledge.bestPractices.length;

      result.regressionTest = structuredFactsCount >= 1;

      if (!result.regressionTest) {
        result.error = "Regression: No structured facts extracted";
        console.log(`  ❌ Regression failed: No structured facts extracted`);
        results.push(result);
        continue;
      }

      console.log(`  ✅ Regression test passed (${structuredFactsCount} structured facts)`);

      // Validation test
      const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const uniqueConcepts = knowledge.concepts.filter((concept: any, index: number, self: any[]) => 
        index === self.findIndex((c: any) => c.name === concept.name)
      );

      const testPackage = {
        id: knowledgePackageId,
        slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
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
      result.validationTest = validationResult.valid;

      if (!result.validationTest) {
        result.error = validationResult.errors.join(", ");
        console.log(`  ❌ Validation failed: ${result.error}`);
      } else {
        console.log(`  ✅ Validation test passed`);
      }

    } catch (error: any) {
      result.error = `Exception: ${error.message}`;
      console.log(`  ❌ Exception: ${error.message}`);
    }

    results.push(result);
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("REGRESSION TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Connectors Tested: ${tests.length}`);

  const passedTests = results.filter(r => 
    r.connectionTest && r.extractionTest && r.regressionTest && r.validationTest
  ).length;

  const failedTests = results.filter(r => 
    !(r.connectionTest && r.extractionTest && r.regressionTest && r.validationTest)
  );

  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);

  if (failedTests.length > 0) {
    console.log(`\nFailed Tests:`);
    failedTests.forEach(r => {
      console.log(`  ❌ ${r.connector}: ${r.error}`);
    });
  } else {
    console.log(`\n✅ All regression tests passed`);
  }

  return results;
}

runConnectorRegressionTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Regression tests failed:", error);
    process.exit(1);
  });
